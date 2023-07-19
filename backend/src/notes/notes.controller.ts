import {
  Controller,
  Logger,
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
  UnauthorizedException,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { AuthorizedRolesAny } from '../guards/jwt.roles.decorator';
import { AzblobService } from '../azblob/azblob.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { GroupsService } from '../groups/groups.service';
import { RestError } from '@azure/storage-blob';
import { EsService } from '../es/es.service';
import { SearchRequest } from '@elastic/elasticsearch/lib/api/types';
import { CommentsService } from '../comments/comments.service';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';

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
        throw new InternalServerErrorException();
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
                members: { some: { userId: userId, role: 'ADMIN' } },
              }, // writeNotePermission is ADMIN and user is admin of group
              {
                writeNotePermission: 'MEMBER',
                members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
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
        throw new ForbiddenException("You're not allowed to create notes in this group");
      }
    }

    let note;
    try {
      note = await this.notesService.create({
        data: {
          user: { connect: { id: userId } },
          group: group ? { connect: { id: groupId } } : undefined,
          title: data.title,
          status: group
            ? group.writeNoteCondition === 'REQUIRE_ADMIN_APPROVAL'
              ? 'PENDING_APPROVAL'
              : 'NORMAL'
            : 'NORMAL',
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
  async findNotes(
    @Request() request: any,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    let notes;
    try {
      notes = await this.notesService.findMany({
        where: {
          blobPointer: { not: null }, // only notes with blobPointer
          user: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
          OR: [
            { userId: userId }, // user is owner
            {
              status: 'NORMAL',
              group: {
                handle: { not: null },
                status: 'NORMAL',
                readNotePermission: 'ADMIN',
                members: { some: { userId: userId, role: 'ADMIN' } },
              },
            }, // readNotePermission is ADMIN and user is admin of group
            {
              status: 'NORMAL',
              group: {
                handle: { not: null },
                status: 'NORMAL',
                readNotePermission: 'MEMBER',
                members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
              },
            }, // readNotePermission is MEMBER and user is member of group
            {
              status: 'NORMAL',
              group: { handle: { not: null }, status: 'NORMAL', readNotePermission: 'ALL' },
            }, // readNotePermission is ALL
          ],
        },
        include: { user: true, group: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    return notes;
  }

  @Get('count')
  async countNotes(@Request() request: any) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let count;
    try {
      count = this.notesService.count({
        where: {
          blobPointer: { not: null }, // only notes with blobPointer
          user: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
          OR: [
            { userId: userId }, // user is owner
            {
              status: 'NORMAL',
              group: {
                handle: { not: null },
                status: 'NORMAL',
                readNotePermission: 'ADMIN',
                members: { some: { userId: userId, role: 'ADMIN' } },
              },
            }, // readNotePermission is ADMIN and user is admin of group
            {
              status: 'NORMAL',
              group: {
                handle: { not: null },
                status: 'NORMAL',
                readNotePermission: 'MEMBER',
                members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
              },
            }, // readNotePermission is MEMBER and user is member of group
            {
              status: 'NORMAL',
              group: { handle: { not: null }, status: 'NORMAL', readNotePermission: 'ALL' },
            }, // readNotePermission is ALL
          ],
        },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return count;
  }

  @Get('search')
  async search(
    @Request() request: any,
    @Query('q') q: string,
    @Query('skip', ParseIntPipe) skip: number,
    @Query('take', ParseIntPipe) take: number,
  ) {
    const userId = request.user.id;
    const groups = await this.groupsService.findMany({
      where: {
        status: 'NORMAL',
        handle: { not: null }, // only groups with handle
        OR: [
          {
            readNotePermission: 'ADMIN',
            members: { some: { userId: userId, role: 'ADMIN' } },
          }, // readNotePermission is ADMIN and user is admin of group
          {
            readNotePermission: 'MEMBER',
            members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
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
      sort: [{ _score: { order: 'desc' } }, { createdAt: 'desc' }],
      from: skip,
      size: take,
    };
    const result = await this.esService.search(this.esIndex, body);
    return result?.hits?.hits || [];
  }

  private async _getNote(userId: string, noteId: string) {
    return this.notesService.findFirst({
      where: {
        id: noteId,
        blobPointer: { not: null }, // only notes with blobPointer
        user: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
        OR: [
          { userId: userId }, // user is owner
          {
            status: 'NORMAL',
            group: {
              handle: { not: null },
              status: 'NORMAL',
              readNotePermission: 'ADMIN',
              members: { some: { userId: userId, role: 'ADMIN' } },
            },
          }, // readNotePermission is ADMIN and user is admin of group
          {
            status: 'NORMAL',
            group: {
              handle: { not: null },
              status: 'NORMAL',
              readNotePermission: 'MEMBER',
              members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
            },
          }, // readNotePermission is MEMBER and user is member of group
          {
            status: 'NORMAL',
            group: { handle: { not: null }, status: 'NORMAL', readNotePermission: 'ALL' },
          }, // readNotePermission is ALL
        ],
      },
      include: { user: true, group: true },
    });
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
          user: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
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
      note = await this._getNote(userId, id);
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new ForbiddenException();
    }
    return note;
  }

  @Get(':id/md')
  async getMarkdown(@Request() request: any, @Param('id') id: string, @Response() response: any) {
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
          user: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
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
      note = await this._getNote(userId, id);
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new ForbiddenException();
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
          user: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
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
      note = await this._getNote(userId, id);
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new ForbiddenException();
    }

    let comments;
    try {
      comments = await this.commentsService.findMany({
        where: { noteId: note.id, status: 'NORMAL' },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
        skip,
        take,
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return comments;
  }

  @Get(':id/comments/count')
  async countComments(@Request() request: any, @Param('id') id: string) {
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
          user: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
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
      note = await this._getNote(userId, id);
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new ForbiddenException();
    }

    let count;
    try {
      count = await this.commentsService.count({
        where: { noteId: note.id, status: 'NORMAL' },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return count;
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
          user: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
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
          user: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
          OR: [
            {
              userId: userId,
              writeCommentPermission: 'OWNER',
              OR: [{ groupId: null }, { group: { handle: { not: null }, status: 'NORMAL' } }],
            }, // writeCommentPermission is OWNER
            {
              writeCommentPermission: 'MEMBER',
              status: 'NORMAL',
              OR: [
                { groupId: null },
                {
                  group: {
                    handle: { not: null },
                    status: 'NORMAL',
                    members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
                  },
                },
              ],
            }, // writeCommentPermission is MEMBER and user is member of group
            {
              writeCommentPermission: 'ALL',
              status: 'NORMAL',
              OR: [{ groupId: null }, { group: { handle: { not: null }, status: 'NORMAL' } }],
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
        data: { user: { connect: { id: userId } }, note: { connect: { id: note.id } } },
        body: data.body.trim(),
        include: { user: true, note: true },
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
          include: { user: true, group: true },
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
                members: { some: { userId: userId, role: 'ADMIN' } },
              }, // writeNotePermission is ADMIN and user is admin of group
              {
                writeNotePermission: 'MEMBER',
                members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
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
          user: { connect: { id: userId } },
          group: group ? { connect: { id: groupId } } : { disconnect: true },
          status: group
            ? group.writeNoteCondition === 'REQUIRE_ADMIN_APPROVAL'
              ? 'PENDING_APPROVAL'
              : 'NORMAL'
            : 'NORMAL',
          writeCommentPermission: data.writeCommentPermission,
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
