import {
  Controller,
  Get,
  UseGuards,
  Request,
  Response,
  Query,
  ParseIntPipe,
  HttpStatus,
  NotFoundException,
  NotAcceptableException,
  HttpException,
  Param,
  Post,
  Body,
  Put,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { NotesService } from '../notes/notes.service';
import { CirclesService } from '../circles/circles.service';
import { AzblobService } from '../azblob/azblob.service';
import { CreateNoteDto } from '../notes/dto/create-note.dto';
import { UpdateNoteDto } from '../notes/dto/update-note.dto';
import { RestError } from '@azure/storage-blob';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('drafts')
export class DraftsController {
  private blobContainerName = 'note';
  constructor(
    private readonly notesService: NotesService,
    private readonly circlesService: CirclesService,
    private readonly blobsService: AzblobService,
  ) {}

  @Post()
  async create(@Request() request: any, @Body() data: CreateNoteDto) {
    const userId = request.user.id;
    const circleId = data.circle.id;

    // some checks if circle is exists
    if (circleId) {
      const circle = await this.circlesService.findOne({
        where: { id: circleId },
        include: { members: true },
      });

      // if circle is not exists, throw error
      if (!circle) {
        throw new BadRequestException();
      }

      // if circle is private or public, check if user is member
      if (circle.type === 'PUBLIC' || circle.type === 'PRIVATE') {
        if (circle.members?.filter((m) => m.userId === userId).length === 0) {
          throw new BadRequestException();
        }
      }
    }

    return await this.notesService.createDraft({
      data: {
        user: { connect: { id: userId } },
        circle: circleId ? { connect: { id: circleId } } : undefined,
        title: data.title,
        status: data.status,
      },
      body: data.body,
    });
  }

  @Get()
  findMany(
    @Request() request: any,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    return this.notesService.findMany({
      where: {
        status: 'NORMAL',
        draftBlobPointer: { not: null },
        user: { id: userId },
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true, circle: true },
      skip,
      take,
    });
  }

  @Get('count')
  count(@Request() request: any) {
    const userId = request.user.id;
    return this.notesService.count({
      where: {
        status: 'NORMAL',
        draftBlobPointer: { not: null },
        user: { id: userId },
      },
    });
  }

  @Get(':id')
  async findOne(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.id;
    const result = await this.notesService.findFirst({
      where: {
        id: id,
        status: 'NORMAL',
        draftBlobPointer: { not: null },
        user: { id: userId },
      },
      include: { user: true, circle: true },
    });
    if (!result) {
      throw new NotFoundException();
    }
    return result;
  }

  @Get(':id/md')
  async getMarkdown(@Request() request: any, @Param('id') id: string, @Response() response: any) {
    const userId = request.user.id;
    try {
      const note = await this.notesService.findFirst({
        where: {
          id,
          status: 'NORMAL',
          draftBlobPointer: { not: null },
          user: { id: userId },
        },
      });

      if (!note) {
        throw new Error('Note not found');
      }
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob(
        this.blobContainerName,
        `${note.id}/${note.draftBlobPointer}.draft.md`,
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

  @Put(':id')
  async update(@Request() request: any, @Param('id') id: string, @Body() data: UpdateNoteDto) {
    const userId = request.user.id;

    //check input
    if (!id || !userId) {
      throw new BadRequestException();
    }

    //check if note exists
    const note = await this.notesService.findFirst({
      where: {
        id,
        user: { id: userId }, // user is owner
      },
      include: { user: true, circle: true },
    });

    if (!note || !note.user) {
      throw new NotFoundException();
    }

    //update note
    const circle = data.circle?.id ? { connect: { id: data.circle.id } } : { disconnect: true };
    return await this.notesService.updateDraft({
      where: { id },
      data: {
        title: data.title,
        user: { connect: { id: userId } },
        circle: circle,
        status: data.status,
      },
      body: data.body,
    });
  }
}
