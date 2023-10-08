import {
  Controller,
  Logger,
  UseGuards,
  Request,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  NotFoundException,
  ParseIntPipe,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
  DefaultValuePipe,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
//import { AuthorizedRolesAny } from '../guards/jwt.roles.decorator';
import { AzblobService } from '../azblob/azblob.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { GroupsService } from '../groups/groups.service';
import { RestError } from '@azure/storage-blob';
import { EsService } from '../es/es.service';
import { SearchRequest, SearchTotalHits } from '@elastic/elasticsearch/lib/api/types';
import { CommentsService } from '../comments/comments.service';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { RedisService } from '../redis.service';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('notes')
export class NotesController {
  private logger = new Logger(NotesController.name);
  private blobContainerName = 'note';
  private esIndex = 'note';

  constructor(
    private readonly notesService: NotesService,
    private readonly groupsService: GroupsService,
    private readonly commentsService: CommentsService,
    private readonly blobsService: AzblobService,
    private readonly esService: EsService,
    private readonly redisService: RedisService,
  ) {
    this.logger.log('Initializing Groups Controller...');
    this.blobsService.init(this.blobContainerName);
  }

  @Post()
  async create(@Request() request: any, @Body() data: CreateNoteDto) {
    const userId = request.user.id;
    const groupId = data.group.id;

    // check input
    if (!userId) {
      throw new UnauthorizedException();
    }

    let group;
    if (groupId) {
      try {
        group = await this.groupsService.findOne({ where: { id: groupId } });
      } catch (e) {
        this.logger.error(e);
        throw new InternalServerErrorException("Error while checking group's existence");
      }

      // if group is not exists, throw error
      if (!group) {
        throw new NotFoundException();
      }

      try {
        group = await this.groupsService.findFirst({
          where: {
            id: groupId,
            status: 'NORMAL',
            handle: { not: null }, // only groups with handle
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
        throw new InternalServerErrorException("Error while checking group's permission");
      }

      // if group is not exists, throw error
      if (!group) {
        throw new ForbiddenException("You're not allowed to create notes in this group");
      }
    }

    let note;
    try {
      note = await this.notesService.create({
        data: {
          User: { connect: { id: userId } },
          Group: group ? { connect: { id: groupId } } : undefined,
          Topics: {
            create: data.topic.ids.map((topicId) => ({ topicId: topicId })),
          },
          title: data.title,
          status: 'NORMAL',
          writeCommentPermission: data.writeCommentPermission,
          publishedAt: new Date(),
        },
        body: data.body,
      });
    } catch (e) {
      throw new InternalServerErrorException('Error while creating note');
    }
    return note;
  }

  @Get()
  async findNotes(
    @Request() request: any,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    let notes;
    try {
      const [data, total] = await this.notesService.findMany({
        where: {
          blobPointer: { not: null }, // only notes with blobPointer
          User: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
          OR: [
            { userId: userId }, // user is owner
            { status: 'NORMAL', groupId: null }, // group is not assigned
            {
              status: 'NORMAL',
              Group: {
                handle: { not: null },
                status: 'NORMAL',
                readNotePermission: 'ADMIN',
                Members: { some: { userId: userId, role: 'ADMIN' } },
              },
            }, // readNotePermission is ADMIN and user is admin of group
            {
              status: 'NORMAL',
              Group: {
                handle: { not: null },
                status: 'NORMAL',
                readNotePermission: 'MEMBER',
                Members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
              },
            }, // readNotePermission is MEMBER and user is member of group
            {
              status: 'NORMAL',
              Group: { handle: { not: null }, status: 'NORMAL', readNotePermission: 'ALL' },
            }, // readNotePermission is ALL
          ],
        },
        include: {
          User: true,
          Group: true,
          _count: { select: { Liked: true } },
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: skip && skip > 0 ? skip : undefined,
        take: take && take > 0 ? take : undefined,
      });
      notes = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    return notes;
  }

  @Get('search')
  async search(
    @Request() request: any,
    @Query('q') q: string,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take: number,
  ) {
    const userId = request.user.id;
    const [groups] = await this.groupsService.findMany({
      where: {
        status: 'NORMAL',
        handle: { not: null }, // only groups with handle
        OR: [
          {
            readNotePermission: 'ADMIN',
            Members: { some: { userId: userId, role: 'ADMIN' } },
          }, // readNotePermission is ADMIN and user is admin of group
          {
            readNotePermission: 'MEMBER',
            Members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
          }, // readNotePermission is MEMBER and user is member of group
          { readNotePermission: 'ALL' }, // readNotePermission is ALL
        ],
      },
    });
    const groupIds = groups.map((g) => g.id);
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
            terms: { groupId: ['NULL', ...groupIds] },
          },
        },
      },
      sort: [{ _score: { order: 'desc' } }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      from: skip > 0 ? skip : undefined,
      size: take > 0 ? take : undefined,
    };
    const result = await this.esService.search(this.esIndex, body);
    return {
      data: result?.hits?.hits || [],
      meta: { total: (result?.hits?.total as SearchTotalHits).value || 0 },
    };
  }

  @Get(':id')
  async findOne(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findFirst({
        where: {
          id,
          blobPointer: { not: null }, // only notes with blobPointer
          User: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
        },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }
    try {
      note = await this.notesService._exFindNoteUnderPermission({
        userId: userId,
        noteId: id,
        include: {
          User: true,
          Group: true,
          Topics: { include: { Topic: true } },
          _count: { select: { Liked: true, Stocked: true } },
        },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new ForbiddenException();
    }

    let body: string;
    try {
      const buffer = await this.blobsService.downloadBlobToBuffer(
        this.blobContainerName,
        `${note.id}/${note.blobPointer}.md`,
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

    try {
      const date = new Date().toISOString().split('T')[0];
      await this.redisService
        .multi()
        .zincrby(`notes/view/${date}`, 1, note.id)
        .expire(`notes/view/${date}`, 60 * 60 * 24 * 30)
        .exec();
    } catch (e) {
      this.logger.error(e);
    }

    // update note of group view count
    if (note.groupId !== null) {
      try {
        const date = new Date().toISOString().split('T')[0];
        const key = `groups/view/notes/${date}`;
        await this.redisService
          .multi()
          .zincrby(key, 1, note.groupId)
          .expire(key, 60 * 60 * 24 * 30)
          .exec();
      } catch (e) {
        this.logger.error(e);
      }
    }

    return { ...note, body };
  }

  @Get(':id/comments')
  async getComments(
    @Request() request: any,
    @Param('id') id: string,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findFirst({
        where: {
          id,
          blobPointer: { not: null }, // only notes with blobPointer
          User: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
        },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }
    try {
      note = await this.notesService._exFindNoteUnderPermission({
        userId: userId,
        noteId: id,
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new ForbiddenException();
    }

    let comments;
    try {
      const [data, total] = await this.commentsService.findMany({
        where: { noteId: note.id, status: 'NORMAL' },
        include: { User: true },
        orderBy: { createdAt: 'asc' },
        skip: skip && skip > 0 ? skip : undefined,
        take: take && take > 0 ? take : undefined,
      });
      comments = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return comments;
  }

  @Post(':id/comments')
  async createComment(
    @Request() request: any,
    @Param('id') id: string,
    @Body() data: CreateCommentDto,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findFirst({
        where: {
          id,
          blobPointer: { not: null }, // only notes with blobPointer
          User: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
        },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }
    try {
      note = await this.notesService.findFirst({
        where: {
          id: id,
          blobPointer: { not: null }, // only notes with blobPointer
          User: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
          OR: [
            {
              userId: userId,
              writeCommentPermission: 'OWNER',
              OR: [{ groupId: null }, { Group: { handle: { not: null }, status: 'NORMAL' } }],
            }, // writeCommentPermission is OWNER
            {
              writeCommentPermission: 'MEMBER',
              status: 'NORMAL',
              OR: [
                { groupId: null },
                {
                  Group: {
                    handle: { not: null },
                    status: 'NORMAL',
                    Members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
                  },
                },
              ],
            }, // writeCommentPermission is MEMBER and user is member of group
            {
              writeCommentPermission: 'ALL',
              status: 'NORMAL',
              OR: [{ groupId: null }, { Group: { handle: { not: null }, status: 'NORMAL' } }],
            }, // writeCommentPermission is ALL
          ],
        },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new ForbiddenException();
    }

    let comment;
    try {
      comment = await this.commentsService.create({
        data: { User: { connect: { id: userId } }, Note: { connect: { id: note.id } } },
        body: data.body.trim(),
        include: { User: true, Note: true },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    return comment;
  }

  @Put(':id')
  async update(@Request() request: any, @Param('id') id: string, @Body() data: UpdateNoteDto) {
    const userId = request.user.id;
    const groupId = data.group.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    let group;
    if (groupId) {
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

      try {
        group = await this.groupsService.findFirst({
          where: {
            id: groupId,
            status: 'NORMAL',
            handle: { not: null }, // only groups with handle
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
      if (!group) {
        throw new ForbiddenException("You're not allowed to create notes in this group");
      }
    }

    //update note
    let updatedNote;
    try {
      updatedNote = await this.notesService.update({
        where: { id },
        data: {
          title: data.title,
          User: { connect: { id: userId } },
          Group: group ? { connect: { id: groupId } } : { disconnect: true },
          Topics: {
            deleteMany: { noteId: id },
            create: data.topic.ids.map((topicId) => ({ topicId: topicId })),
          },
          status: 'NORMAL',
          writeCommentPermission: data.writeCommentPermission,
          publishedAt: new Date(),
        },
        body: data.body,
      });
    } catch (e) {
      this.logger.error(e);
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

    let note;
    try {
      note = await this.notesService.findOne({
        where: { id },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }
    try {
      note = await this.notesService.findFirst({
        where: { id, userId, status: 'NORMAL', blobPointer: { not: null } },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new ForbiddenException();
    }

    try {
      note = this.notesService.softRemove({ where: { id: note.id } });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    return note;
  }
}
