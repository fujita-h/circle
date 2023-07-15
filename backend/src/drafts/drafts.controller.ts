import {
  Controller,
  Logger,
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
  ForbiddenException,
  UnauthorizedException,
  Delete,
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
  private logger = new Logger(DraftsController.name);
  private blobContainerName = 'note';
  constructor(
    private readonly notesService: NotesService,
    private readonly circlesService: CirclesService,
    private readonly blobsService: AzblobService,
  ) {
    this.logger.log('Initializing Drafts Controller...');
    this.blobsService.init(this.blobContainerName);
  }

  @Post()
  async create(@Request() request: any, @Body() data: CreateNoteDto) {
    const userId = request.user.id;
    const circleId = data.circle.id;

    if (!userId) {
      throw new BadRequestException();
    }

    // some checks if circle is exists
    if (circleId) {
      let circle;
      try {
        circle = await this.circlesService.findOne({ where: { id: circleId } });
      } catch (e) {
        this.logger.error(e);
        throw new InternalServerErrorException();
      }

      if (!circle) {
        throw new NotFoundException();
      }

      try {
        circle = await this.circlesService.findFirst({
          where: {
            id: circleId,
            status: 'NORMAL',
            handle: { not: null },
            OR: [
              {
                writeNotePermission: 'ADMIN',
                members: { some: { userId: userId, role: 'ADMIN' } },
              }, // writeNotePermission is ADMIN and user is admin of circle
              {
                writeNotePermission: 'MEMBER',
                members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
              }, // writeNotePermission is MEMBER and user is member of circle
              { writeNotePermission: 'ALL' }, // writeNotePermission is ALL
            ],
          },
        });
      } catch (e) {
        this.logger.error(e);
        throw new InternalServerErrorException();
      }

      // if circle is not exists, throw error
      if (!circle) {
        throw new ForbiddenException("You're not allowed to create drafts in this circle");
      }
    }

    let note;
    try {
      note = await this.notesService.createDraft({
        data: {
          user: { connect: { id: userId } },
          circle: circleId ? { connect: { id: circleId } } : undefined,
          title: data.title,
          status: 'NORMAL',
          writeCommentPermission: data.writeCommentPermission,
        },
        body: data.body,
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    return note;
  }

  @Get()
  async findMany(
    @Request() request: any,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    let drafts;
    try {
      drafts = await this.notesService.findMany({
        where: {
          status: 'NORMAL',
          draftBlobPointer: { not: null },
          userId: userId,
        },
        orderBy: { createdAt: 'desc' },
        include: { user: true, circle: true },
        skip,
        take,
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    return drafts;
  }

  @Get('count')
  async count(@Request() request: any) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let count;
    try {
      count = this.notesService.count({
        where: {
          status: 'NORMAL',
          draftBlobPointer: { not: null },
          userId: userId,
        },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return count;
  }

  private async _getDraft(userId: string, draftId: string) {
    return this.notesService.findFirst({
      where: {
        id: draftId,
        status: 'NORMAL',
        draftBlobPointer: { not: null },
        userId: userId,
      },
      include: { user: true, circle: true },
    });
  }

  @Get(':id')
  async findOne(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let draft;
    try {
      draft = await this._getDraft(userId, id);
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!draft) {
      throw new NotFoundException();
    }
    return draft;
  }

  @Get(':id/md')
  async getMarkdown(@Request() request: any, @Param('id') id: string, @Response() response: any) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let draft;
    try {
      draft = await this._getDraft(userId, id);
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!draft) {
      throw new NotFoundException();
    }

    try {
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob(
        this.blobContainerName,
        `${draft.id}/${draft.draftBlobPointer}.draft.md`,
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
    const circleId = data.circle?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    //check if note exists
    let note;
    try {
      note = await this.notesService.findFirst({
        where: { id, userId, status: 'NORMAL', draftBlobPointer: { not: null } },
        include: { user: true, circle: true },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    if (circleId) {
      let circle;
      try {
        circle = await this.circlesService.findFirst({
          where: {
            id: circleId,
            status: 'NORMAL',
            handle: { not: null },
            OR: [
              {
                writeNotePermission: 'ADMIN',
                members: { some: { userId: userId, role: 'ADMIN' } },
              }, // writeNotePermission is ADMIN and user is admin of circle
              {
                writeNotePermission: 'MEMBER',
                members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
              }, // writeNotePermission is MEMBER and user is member of circle
              { writeNotePermission: 'ALL' }, // writeNotePermission is ALL
            ],
          },
        });
      } catch (e) {
        this.logger.error(e);
        throw new InternalServerErrorException();
      }

      // if circle is not exists, throw error
      if (!circle) {
        throw new ForbiddenException("You're not allowed to create drafts in this circle");
      }
    }

    //update note
    let updatedNote;
    try {
      updatedNote = await this.notesService.updateDraft({
        where: { id },
        data: {
          title: data.title,
          user: { connect: { id: userId } },
          circle: circleId ? { connect: { id: circleId } } : undefined,
          status: 'NORMAL',
          writeCommentPermission: data.writeCommentPermission,
        },
        body: data.body,
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    return updatedNote;
  }

  @Delete(':id')
  async remove(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let draft;
    try {
      draft = await this.notesService.findOne({
        where: { id },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!draft) {
      throw new NotFoundException();
    }
    try {
      draft = await this.notesService.findFirst({
        where: { id, userId, status: 'NORMAL', draftBlobPointer: { not: null } },
        include: { user: true, circle: true },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!draft) {
      throw new ForbiddenException();
    }

    try {
      draft = await this.notesService.softRemove({
        where: { id: draft.id },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    return draft;
  }
}
