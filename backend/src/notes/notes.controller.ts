import {
  Controller,
  UseGuards,
  Request,
  Response,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  HttpStatus,
  HttpException,
  Query,
  NotFoundException,
  ParseIntPipe,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { AuthorizedRolesAny } from '../guards/jwt.roles.decorator';
import { AzblobService } from '../azblob/azblob.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { CirclesService } from '../circles/circles.service';
import { RestError } from '@azure/storage-blob';
import { EsService } from '../es/es.service';
import { SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { CommentsService } from '../comments/comments.service';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('notes')
export class NotesController {
  private blobContainerName = 'note';
  private esIndex = 'note';

  constructor(
    private readonly notesService: NotesService,
    private readonly circlesService: CirclesService,
    private readonly commentsService: CommentsService,
    private readonly blobsService: AzblobService,
    private readonly esService: EsService,
  ) {}

  @Post()
  async create(@Request() request: any, @Body() data: CreateNoteDto) {
    const userId = request.user.id;
    const circleId = data.circle.id;

    // check input
    if (!userId || !circleId) {
      throw new BadRequestException();
    }

    // check circle
    const circle = await this.circlesService.findOne({
      where: { id: circleId },
      include: { members: true },
    });

    // if circle is not exists, throw error
    if (!circle) {
      throw new BadRequestException();
    }

    // check if user is member
    if (
      circle.members === undefined ||
      circle.members.filter((m) => m.userId === userId).length === 0
    ) {
      throw new ForbiddenException("You're not allowed to create notes in this circle");
    }

    return await this.notesService.create({
      data: {
        user: { connect: { id: userId } },
        circle: { connect: { id: circleId } },
        title: data.title,
        status: data.status,
      },
      body: data.body,
    });
  }

  @Get()
  findNotes(
    @Request() request: any,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    return this.notesService.findMany({
      where: {
        status: 'NORMAL',
        blobPointer: { not: null }, // only notes with blobPointer
        circle: { handle: { not: null }, status: 'NORMAL' }, // only notes in existing circles
        user: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
        OR: [
          { user: { id: userId } }, // user is owner
          {
            // user is member of circle
            circle: {
              members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } },
            },
          },
          { circle: { type: { in: ['OPEN', 'PUBLIC'] } } }, // circle is open or public
        ],
      },
      include: { user: true, circle: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  @Get('count')
  async countNotes(@Request() request: any) {
    const userId = request.user.id;
    return this.notesService.count({
      where: {
        status: 'NORMAL',
        blobPointer: { not: null }, // only notes with blobPointer
        circle: { handle: { not: null }, status: 'NORMAL' }, // only notes in existing circles
        user: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
        OR: [
          { user: { id: userId } }, // user is owner
          {
            // user is member of circle
            circle: {
              members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } },
            },
          },
          { circle: { type: { in: ['OPEN', 'PUBLIC'] } } }, // circle is open or public
        ],
      },
    });
  }

  @Get('search')
  async search(
    @Request() request: any,
    @Query('q') q: string,
    @Query('skip', ParseIntPipe) skip: number,
    @Query('take', ParseIntPipe) take: number,
  ) {
    const userId = request.user.id;
    const circles = await this.circlesService.findMany({
      where: {
        status: 'NORMAL',
        handle: { not: null }, // only circles with handle
        OR: [
          { members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } } }, // user is member of circle
          { type: { in: ['OPEN', 'PUBLIC'] } }, // circle is open or public
        ],
      },
    });
    const circleIds = circles.map((g) => g.id);
    if (q === undefined || q === null || q === '') {
      q = '*';
    }
    const body: SearchRequest = {
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query: q,
                fields: ['title^5', 'body^5', 'title.ngram^2', 'body.ngram^2'],
                operator: 'and',
              },
            },
            {
              wildcard: {
                title: {
                  value: q,
                  boost: 5,
                },
              },
            },
            {
              wildcard: {
                'title.ngram': {
                  value: q,
                  boost: 2,
                },
              },
            },
            {
              wildcard: {
                body: {
                  value: q,
                  boost: 10,
                },
              },
            },
            {
              wildcard: {
                'body.ngram': {
                  value: q,
                  boost: 5,
                },
              },
            },
          ],
          minimum_should_match: 1,
          filter: {
            terms: { circleId: circleIds },
          },
        },
      },
      sort: [{ _score: { order: 'desc' } }, { createdAt: 'desc' }],
      from: skip,
      size: take,
    };
    const result = await this.esService.search(this.esIndex, body);
    return result?.hits?.hits || [];
  }

  @Get(':id')
  async findOne(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.id;

    // check input
    if (!id || !userId) {
      throw new BadRequestException();
    }

    // retrieve note
    const note = await this.notesService.findOne({
      where: { id },
      include: { user: true, circle: true },
    });

    // check note
    if (
      !note ||
      !note.user ||
      note.user.handle === null ||
      note.user.status === 'DELETED' ||
      !note.circle ||
      note.circle.handle === null ||
      note.circle.status === 'DELETED' ||
      note.status === 'DELETED' ||
      note.blobPointer === null
    ) {
      throw new NotFoundException();
    }

    // retrieve circle
    const circle = await this.circlesService.findOne({
      where: { id: note.circle.id },
      include: { members: true },
    });

    // check circle
    if (!circle || circle.status === 'DELETED' || circle.handle === null) {
      throw new NotFoundException();
    }

    // allow access if user is owner
    if (note.user.id === userId) {
      if (circle.members?.find((m) => m.userId === userId)) {
        // allow edit if user is owner and user is member of circle
        return { ...note, canEdit: true };
      } else {
        return note;
      }
    }

    // allow access if circle is open or public
    if (note.circle.type === 'OPEN' || note.circle.type === 'PUBLIC') {
      return note;
    }

    // allow access if user is member of private circle
    if (note.circle.type === 'PRIVATE') {
      if (circle.members?.find((m) => m.userId === userId)) {
        return note;
      }
    }

    // if none of the above, throw exception
    throw new ForbiddenException("You're not allowed to view this note");
  }

  @Get(':id/md')
  async getMarkdown(@Request() request: any, @Param('id') id: string, @Response() response: any) {
    const note = await this.findOne(request, id);
    if (!note) {
      throw new Error('Note not found');
    }

    try {
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob(
        this.blobContainerName,
        `${note.id}/${note.blobPointer}.md`,
      );
      response.setHeader('Content-Type', downloadBlockBlobResponse.contentType);
      downloadBlockBlobResponse.readableStreamBody?.pipe(response);
    } catch (e) {
      if (e instanceof RestError) {
        if (e.statusCode === 404) {
          throw new NotFoundException();
        }
      }
      throw new InternalServerErrorException();
    }
  }

  @Get(':id/comments')
  async getComments(
    @Request() request: any,
    @Param('id') id: string,
    @Query('skip', ParseIntPipe) skip: number,
    @Query('take', ParseIntPipe) take: number,
  ) {
    return this.commentsService.findMany({
      where: { noteId: id, status: 'NORMAL' },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    });
  }

  @Post(':id/comments')
  async createComment(
    @Request() request: any,
    @Param('id') id: string,
    @Body() data: CreateCommentDto,
  ) {
    const userId = request.user.id;

    // check note
    const note = await this.notesService.findOne({
      where: { id },
    });

    if (!note || note.status === 'DELETED') {
      throw new NotFoundException();
    }

    return this.commentsService.create({
      data: { user: { connect: { id: userId } }, note: { connect: { id: note.id } } },
      body: data.body.trim(),
      include: { user: true, note: true },
    });
  }

  @Get(':id/comments/count')
  async countComments(@Param('id') id: string) {
    // check note
    const note = await this.notesService.findOne({
      where: { id },
    });

    if (!note || note.status === 'DELETED') {
      throw new NotFoundException();
    }

    return this.commentsService.count({ where: { noteId: id, status: 'NORMAL' } });
  }

  @Put(':id')
  async update(@Request() request: any, @Param('id') id: string, @Body() data: UpdateNoteDto) {
    const userId = request.user.id;
    const circleId = data.circle.id;

    //check input
    if (!id || !userId || !circleId) {
      throw new BadRequestException();
    }

    // retrieve note
    const note = await this.notesService.findOne({
      where: { id },
      include: { user: true, circle: true },
    });

    // check note
    if (!note || !note.user || note.status === 'DELETED') {
      throw new NotFoundException();
    }

    // check if user is owner
    if (note.userId !== userId) {
      throw new ForbiddenException("You're not allowed to update this note");
    }

    // check circle
    const circle = await this.circlesService.findOne({
      where: { id: circleId },
      include: { members: true },
    });

    // if circle is not exists, throw error
    if (!circle) {
      throw new BadRequestException();
    }

    // check if user is member
    if (
      circle.members === undefined ||
      circle.members.filter((m) => m.userId === userId).length === 0
    ) {
      throw new ForbiddenException("You're not allowed to create notes in this circle");
    }

    //update note
    return await this.notesService.update({
      where: { id },
      data: {
        title: data.title,
        user: { connect: { id: userId } },
        circle: { connect: { id: circleId } },
        status: data.status,
      },
      body: data.body,
    });
  }

  @Delete(':id')
  async remove(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.id;

    // check input
    if (!id || !userId) {
      throw new BadRequestException();
    }

    // retrieve note
    const note = await this.notesService.findOne({
      where: { id },
      include: { user: true, circle: true },
    });

    // check note
    if (!note || !note.user || !note.circle || note.status === 'DELETED') {
      throw new NotFoundException();
    }

    // check permissions
    let allowUpdate = false;

    // allow access if user is owner
    if (note.user.id === userId) {
      allowUpdate = true;
    }

    // throw exception if not allowed
    if (!allowUpdate) {
      throw new ForbiddenException("You're not allowed to delete this note");
    }

    return this.notesService.softRemove({ where: { id: note.id } });
  }
}
