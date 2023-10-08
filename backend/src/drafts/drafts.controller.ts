import {
  Controller,
  Logger,
  Get,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  NotFoundException,
  Param,
  Post,
  Body,
  Put,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
  UnauthorizedException,
  Delete,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { NotesService } from '../notes/notes.service';
import { GroupsService } from '../groups/groups.service';
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
    private readonly groupsService: GroupsService,
    private readonly blobsService: AzblobService,
  ) {
    this.logger.log('Initializing Drafts Controller...');
    this.blobsService.init(this.blobContainerName);
  }

  @Post()
  async create(@Request() request: any, @Body() data: CreateNoteDto) {
    const userId = request.user.id;
    const groupId = data.group.id;

    if (!userId) {
      throw new BadRequestException();
    }

    // some checks if group is exists
    let group;
    if (groupId) {
      try {
        group = await this.groupsService.findOne({ where: { id: groupId } });
      } catch (e) {
        this.logger.error(e);
        throw new InternalServerErrorException();
      }

      if (!group) {
        throw new NotFoundException();
      }

      try {
        group = await this.groupsService.findFirst({
          where: {
            id: groupId,
            status: 'NORMAL',
            handle: { not: null },
            OR: [
              {
                writeNotePermission: 'ADMIN',
                Members: { some: { userId: userId, role: 'ADMIN' } },
              }, // writeNotePermission is ADMIN and user is admin of group
              {
                writeNotePermission: 'MEMBER',
                Members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
              }, // writeNotePermission is MEMBER and user is member of group
              { writeNotePermission: 'ALL' }, // writeNotePermission is ALL
            ],
          },
        });
      } catch (e) {
        this.logger.error(e);
        throw new InternalServerErrorException();
      }

      // if group is not exists, throw error
      if (!group) {
        throw new ForbiddenException("You're not allowed to create drafts in this group");
      }
    }

    let note;
    try {
      note = await this.notesService.createDraft({
        data: {
          User: { connect: { id: userId } },
          Group: groupId ? { connect: { id: groupId } } : undefined,
          Topics: {
            create: data.topic.ids.map((topicId) => ({
              topicId: topicId,
              order: data.topic.ids.indexOf(topicId),
            })),
          },
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
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let drafts;
    try {
      const [data, total] = await this.notesService.findMany({
        where: {
          status: 'NORMAL',
          draftBlobPointer: { not: null },
          userId: userId,
        },
        orderBy: { createdAt: 'desc' },
        include: { User: true, Group: true },
        skip: skip && skip > 0 ? skip : undefined,
        take: take && take > 0 ? take : undefined,
      });
      drafts = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    return drafts;
  }

  private async _getDraft(userId: string, draftId: string) {
    return this.notesService.findFirst({
      where: {
        id: draftId,
        status: 'NORMAL',
        draftBlobPointer: { not: null },
        userId: userId,
      },
      include: {
        User: true,
        Group: true,
        Topics: { include: { Topic: true }, orderBy: { order: 'asc' } },
      },
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

    let body: string;
    try {
      const buffer = await this.blobsService.downloadBlobToBuffer(
        this.blobContainerName,
        `${draft.id}/${draft.draftBlobPointer}.draft.md`,
      );
      body = buffer.toString();
    } catch (e) {
      if (e instanceof RestError) {
        if (e.statusCode === 404) {
          throw new NotFoundException();
        }
      }
      throw new InternalServerErrorException();
    }

    return { ...draft, body };
  }

  @Put(':id')
  async update(@Request() request: any, @Param('id') id: string, @Body() data: UpdateNoteDto) {
    const userId = request.user.id;
    const groupId = data.group?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    //check if note exists
    let note;
    try {
      note = await this.notesService.findFirst({
        where: { id, userId, status: { not: 'DELETED' } },
        include: { User: true, Group: true },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    if (groupId) {
      let group;
      try {
        group = await this.groupsService.findFirst({
          where: {
            id: groupId,
            status: 'NORMAL',
            handle: { not: null },
            OR: [
              {
                writeNotePermission: 'ADMIN',
                Members: { some: { userId: userId, role: 'ADMIN' } },
              }, // writeNotePermission is ADMIN and user is admin of group
              {
                writeNotePermission: 'MEMBER',
                Members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
              }, // writeNotePermission is MEMBER and user is member of group
              { writeNotePermission: 'ALL' }, // writeNotePermission is ALL
            ],
          },
        });
      } catch (e) {
        this.logger.error(e);
        throw new InternalServerErrorException();
      }

      // if group is not exists, throw error
      if (!group) {
        throw new ForbiddenException("You're not allowed to create drafts in this group");
      }
    }

    //update note
    let updatedNote;
    try {
      updatedNote = await this.notesService.updateDraft({
        where: { id },
        data: {
          title: data.title,
          User: { connect: { id: userId } },
          Group: groupId ? { connect: { id: groupId } } : undefined,
          Topics: {
            deleteMany: { noteId: id },
            create: data.topic.ids.map((topicId) => ({
              topicId: topicId,
              order: data.topic.ids.indexOf(topicId),
            })),
          },
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
        include: { User: true, Group: true },
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
