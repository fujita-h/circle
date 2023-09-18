import { RestError } from '@azure/storage-blob';
import * as Iron from '@hapi/iron';
import {
  Body,
  ConflictException,
  Controller,
  DefaultValuePipe,
  Delete,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Logger,
  NotAcceptableException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  PayloadTooLargeException,
  Post,
  Put,
  Query,
  Request,
  Response,
  UnauthorizedException,
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { Prisma } from '@prisma/client';
import * as jdenticon from 'jdenticon';

import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';

import { AzblobService } from '../azblob/azblob.service';
import { FollowGroupsService } from '../follow-groups/follow-groups.service';
import { FollowUsersService } from '../follow-users/follow-users.service';
import { GroupsService } from '../groups/groups.service';
import { LikesService } from '../likes/likes.service';
import {
  MembershipsService,
  MembershipsServiceException,
} from '../memberships/memberships.service';
import { NotesService } from '../notes/notes.service';
import { RedisService } from '../redis.service';
import { StockLabelsService } from '../stock-labels/stock-labels.service';
import { StocksService } from '../stocks/stocks.service';
import { UsersService } from '../users/users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('user')
export class UserController {
  private logger = new Logger(UserController.name);
  private IRON_SECRET: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly blobsService: AzblobService,
    private readonly followUsersService: FollowUsersService,
    private readonly followGroupsService: FollowGroupsService,
    private readonly groupsService: GroupsService,
    private readonly likesService: LikesService,
    private readonly membershipsService: MembershipsService,
    private readonly notesService: NotesService,
    private readonly redisService: RedisService,
    private readonly stockLabelsService: StockLabelsService,
    private readonly stocksService: StocksService,
    private readonly usersService: UsersService,
  ) {
    if (!this.configService.get<string>('IRON_SECRET')) {
      this.logger.error('IRON_SECRET is not defined');
      throw new Error('IRON_SECRET is not defined');
    }
    this.IRON_SECRET = this.configService.get<string>('IRON_SECRET') || '';
  }

  checkHandle(handle: string) {
    if (!handle || !handle.match(/^[a-zA-Z][0-9a-zA-Z\-]{2,}$/i)) {
      throw new Error('Invalid handle');
    }
  }

  @Get()
  async findOne(@Request() request: any) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let user;
    try {
      user = await this.usersService.findOne({ where: { id: userId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  @Patch()
  async update(@Request() request: any, @Body() data: UpdateUserDto) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (data.handle) {
      try {
        this.checkHandle(data.handle);
      } catch (e) {
        throw new UnprocessableEntityException();
      }
    }

    let user;
    try {
      user = await this.usersService.update({
        where: { id: userId },
        data: {
          handle: data.handle ?? undefined,
          name: data.name ?? undefined,
          email: data.email ?? undefined,
        },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  @Get('roles')
  async findRoles(@Request() request: any) {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    const roles = request.user?.token?.roles || request.user?.roles || [];
    return { data: roles };
  }

  @Get('following/groups')
  async findFollowingGroups(
    @Request() request: any,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let followGroups;
    try {
      const [data, total] = await this.followGroupsService.findMany({
        where: { userId, Group: { handle: { not: null }, status: 'NORMAL' } },
        orderBy: { createdAt: 'asc' },
        include: { Group: true },
        skip: skip && skip > 0 ? skip : undefined,
        take: take && take > 0 ? take : undefined,
      });
      followGroups = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return followGroups;
  }

  @Get('following/groups/:groupId')
  async findFollowingGroup(@Request() request: any, @Param('groupId') groupId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let group;
    try {
      group = await this.groupsService.findFirst({
        where: { id: groupId, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }

    let followGroup;
    try {
      followGroup = await this.followGroupsService.findFirst({
        where: { userId, groupId },
        include: { Group: true },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return { ...followGroup };
  }

  @Put('following/groups/:groupId')
  async followGroup(@Request() request: any, @Param('groupId') groupId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let group;
    try {
      group = await this.groupsService.findFirst({
        where: { id: groupId, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException('Group not found');
    }
    if (!group) {
      throw new NotFoundException();
    }

    let followGroup;
    try {
      followGroup = await this.followGroupsService.createIfNotExists({ userId, groupId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException('Failed to follow group');
    }
    return { ...followGroup };
  }

  @Delete('following/groups/:groupId')
  async unfollowGroup(@Request() request: any, @Param('groupId') groupId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let group;
    try {
      group = await this.groupsService.findFirst({
        where: { id: groupId, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }

    let followGroup;
    try {
      followGroup = await this.followGroupsService.removeIfExists({ userId, groupId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return { ...followGroup };
  }

  @Get('following/users')
  async findFollowingUsers(
    @Request() request: any,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let followUsers;
    try {
      const [data, total] = await this.followUsersService.findMany({
        where: { fromId: userId, To: { handle: { not: null }, status: 'NORMAL' } },
        orderBy: { createdAt: 'asc' },
        include: { To: true },
        skip: skip && skip > 0 ? skip : undefined,
        take: take && take > 0 ? take : undefined,
      });
      followUsers = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return followUsers;
  }

  @Get('following/users/:userId')
  async findFollowingUser(@Request() request: any, @Param('userId') userId: string) {
    const fromId = request.user.id;
    if (!fromId) {
      throw new UnauthorizedException();
    }

    let to;
    try {
      to = await this.usersService.findFirst({
        where: { id: userId, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!to) {
      throw new NotFoundException();
    }

    let followUser;
    try {
      followUser = await this.followUsersService.findFirst({
        where: { fromId, toId: userId },
        include: { To: true },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return { ...followUser };
  }

  @Put('following/users/:userId')
  async followUser(@Request() request: any, @Param('userId') userId: string) {
    const fromId = request.user.id;
    if (!fromId) {
      throw new UnauthorizedException();
    }

    let to;
    try {
      to = await this.usersService.findFirst({
        where: { id: userId, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException('User not found');
    }
    if (!to) {
      throw new NotFoundException();
    }

    let followUser;
    try {
      followUser = await this.followUsersService.createIfNotExists({ fromId, toId: userId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException('Failed to follow user');
    }
    return { ...followUser };
  }

  @Delete('following/users/:userId')
  async unfollowUser(@Request() request: any, @Param('userId') userId: string) {
    const fromId = request.user.id;
    if (!fromId) {
      throw new UnauthorizedException();
    }

    let to;
    try {
      to = await this.usersService.findFirst({
        where: { id: userId, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!to) {
      throw new NotFoundException();
    }

    let followUser;
    try {
      followUser = await this.followUsersService.removeIfExists({ fromId, toId: userId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return { ...followUser };
  }

  @Get('following/notes')
  async findFollowingNotes(
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
          AND: [
            {
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
            {
              // following users or groups
              OR: [
                { User: { FollowedUsers: { some: { fromId: userId } } } },
                { Group: { Followed: { some: { userId: userId } } } },
              ],
            },
          ],
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        include: { User: true, Group: true, _count: { select: { Liked: true } } },
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

  @Get('trending/notes/weekly')
  async findWeeklyTrendingNotes(
    @Request() request: any,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take?: number,
  ) {
    return this._findTrendingNotes('notes/trending/weekly', request, take);
  }

  @Get('trending/notes/monthly')
  async findMonthlyTrendingNotes(
    @Request() request: any,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take?: number,
  ) {
    return this._findTrendingNotes('notes/trending/monthly', request, take);
  }

  async _findTrendingNotes(index: string, @Request() request: any, take?: number) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let trendingNotes;
    try {
      trendingNotes = await this.redisService.zrange(
        index,
        '+inf',
        0,
        'BYSCORE',
        'REV',
        'LIMIT',
        0,
        Math.min((take || 20) * 100, 20000),
      );
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    let notes;
    try {
      const [data, total] = await this.notesService.findMany({
        where: {
          AND: [
            {
              id: { in: trendingNotes },
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
          ],
        },
        include: { User: true, Group: true, _count: { select: { Liked: true } } },
      });
      notes = {
        data: trendingNotes
          .map((id) => data.find((note: any) => note.id === id))
          .filter(Boolean)
          .slice(0, take),
        meta: { total },
      };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return notes;
  }

  @Get('groups/postable')
  async findPostable(@Request() request: any) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let groups;
    try {
      const [data] = await this.groupsService.findMany({
        where: {
          status: 'NORMAL',
          handle: { not: null },
          Members: { some: { User: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } },
        },
      });
      groups = data;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return groups;
  }

  @Get('joined/groups')
  async findJoinedGroups(
    @Request() request: any,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let memberships;
    try {
      const [data, total] = await this.membershipsService.findMany({
        where: { userId, role: { in: ['ADMIN', 'MEMBER'] } },
        orderBy: { createdAt: 'asc' },
        include: { Group: true },
        skip: skip && skip > 0 ? skip : undefined,
        take: take && take > 0 ? take : undefined,
      });
      memberships = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return memberships;
  }

  @Get('joined/groups/:groupId')
  async findJoinedGroup(@Request() request: any, @Param('groupId') groupId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let membership;
    try {
      membership = await this.membershipsService.findFirst({
        where: { userId, groupId },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return { membership };
  }

  @Put('joined/groups/:groupId')
  async joinGroup(@Request() request: any, @Param('groupId') groupId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let group;
    try {
      group = await this.groupsService.findOne({ where: { id: groupId } });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }

    if (group.joinGroupCondition === 'DENIED') {
      throw new ForbiddenException();
    }

    const role =
      group.joinGroupCondition === 'REQUIRE_ADMIN_APPROVAL' ? 'PENDING_APPROVAL' : 'MEMBER';

    let membership;
    try {
      membership = await this.membershipsService.createIfNotExists({ userId, groupId, role });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    return { ...membership };
  }

  @Delete('joined/groups/:groupId')
  async leaveGroup(@Request() request: any, @Param('groupId') groupId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let group;
    try {
      group = await this.groupsService.findOne({ where: { id: groupId } });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }

    let membership;
    try {
      membership = await this.membershipsService.removeIfExists({ userId, groupId });
    } catch (e) {
      if (e instanceof MembershipsServiceException) {
        throw new ForbiddenException(e.message);
      }
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    return { ...membership };
  }

  @Get('liked/notes')
  async findLikedNotes(
    @Request() request: any,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let likes;
    try {
      const [data, total] = await this.likesService.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        skip: skip && skip > 0 ? skip : undefined,
        take: take && take > 0 ? take : undefined,
      });
      likes = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return likes;
  }

  @Get('liked/notes/:noteId')
  async findLikedNote(@Request() request: any, @Param('noteId') noteId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findOne({ where: { id: noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    let liked;
    let count: number;
    try {
      liked = await this.likesService.findFirst({ where: { userId, noteId } });
      count = await this.likesService.count({ where: { noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return { liked, count };
  }

  @Put('liked/notes/:noteId')
  async likeNote(@Request() request: any, @Param('noteId') noteId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findOne({ where: { id: noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    try {
      note = await this.notesService._exFindNoteUnderPermission({ userId, noteId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new ForbiddenException();
    }

    let like;
    try {
      like = await this.likesService.createIfNotExists({ userId, noteId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    try {
      if (like.created) {
        const date = new Date().toISOString().split('T')[0];
        await this.redisService
          .multi()
          .zincrby(`notes/like/${date}`, 1, note.id)
          .expire(`notes/like/${date}`, 60 * 60 * 24 * 30)
          .exec();
      }
    } catch (e) {
      this.logger.error(e);
    }

    return { ...like };
  }

  @Delete('liked/notes/:noteId')
  async unlikeNote(@Request() request: any, @Param('noteId') noteId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findOne({ where: { id: noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    let like;
    try {
      like = await this.likesService.removeIfExist({ userId, noteId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    try {
      if (like.deleted) {
        const date = new Date().toISOString().split('T')[0];
        await this.redisService
          .multi()
          .zincrby(`notes/like/${date}`, -1, note.id)
          .expire(`notes/like/${date}`, 60 * 60 * 24 * 30)
          .exec();
      }
    } catch (e) {
      this.logger.error(e);
    }

    return { ...like };
  }

  @Get('stocked/notes')
  async findStockedNotes(
    @Request() request: any,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let stocks;
    try {
      const [data, total] = await this.stocksService.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        include: { Label: true, Note: { include: { User: true, Group: true } } },
        skip: skip && skip > 0 ? skip : undefined,
        take: take && take > 0 ? take : undefined,
      });
      stocks = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return stocks;
  }

  @Get('stocked/notes/:noteId')
  async findStockedNote(@Request() request: any, @Param('noteId') noteId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findOne({ where: { id: noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    let stocked;
    let count: number;
    try {
      const [data] = await this.stocksService.findMany({
        where: { noteId, userId },
        include: { Label: true },
      });
      const data2 = await this.stocksService.findManyDistinct({
        where: { noteId },
        distinct: ['userId'],
      });
      stocked = data;
      count = data2.length;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return { stocked, count };
  }

  @Put('stocked/notes/:noteId')
  async stockNote(@Request() request: any, @Param('noteId') noteId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findOne({ where: { id: noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    try {
      note = await this.notesService._exFindNoteUnderPermission({ userId, noteId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new ForbiddenException();
    }

    let label;
    try {
      label = await this.stockLabelsService.findFirst({ where: { userId: userId, default: true } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!label) {
      try {
        label = await this.stockLabelsService.create({
          data: { name: 'あとで読む', default: true, User: { connect: { id: userId } } },
        });
      } catch (e) {
        this.logger.error(e);
        throw new InternalServerErrorException();
      }
    }

    let stock;
    try {
      stock = await this.stocksService.createIfNotExists({ userId, noteId, labelId: label.id });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    try {
      if (stock.created) {
        const date = new Date().toISOString().split('T')[0];
        await this.redisService
          .multi()
          .zincrby(`notes/stock/${date}`, 1, note.id)
          .expire(`notes/stock/${date}`, 60 * 60 * 24 * 30)
          .exec();
      }
    } catch (e) {
      this.logger.error(e);
    }

    return { ...stock };
  }

  @Put('stocked/notes/:noteId/labels/:labelId')
  async stockNoteWithLabel(
    @Request() request: any,
    @Param('noteId') noteId: string,
    @Param('labelId') labelId: string,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findOne({ where: { id: noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    try {
      note = await this.notesService._exFindNoteUnderPermission({ userId, noteId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new ForbiddenException();
    }

    let label;
    try {
      label = await this.stockLabelsService.findFirst({ where: { id: labelId, userId: userId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!label) {
      throw new NotFoundException();
    }

    let stock;
    try {
      stock = await this.stocksService.createIfNotExists({ userId, noteId, labelId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    try {
      if (stock.created) {
        const date = new Date().toISOString().split('T')[0];
        await this.redisService
          .multi()
          .zincrby(`notes/stock/${date}`, 1, note.id)
          .expire(`notes/stock/${date}`, 60 * 60 * 24 * 30)
          .exec();
      }
    } catch (e) {
      this.logger.error(e);
    }

    return { ...stock };
  }

  @Delete('stocked/notes/:noteId/labels/:labelId')
  async unstockNoteWithLabel(
    @Request() request: any,
    @Param('noteId') noteId: string,
    @Param('labelId') labelId: string,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findOne({ where: { id: noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    let stock;
    try {
      stock = await this.stocksService.deleteIfNotExists({ userId, noteId, labelId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    try {
      if (stock.deleted) {
        const date = new Date().toISOString().split('T')[0];
        await this.redisService
          .multi()
          .zincrby(`notes/stock/${date}`, -1, note.id)
          .expire(`notes/stock/${date}`, 60 * 60 * 24 * 30)
          .exec();
      }
    } catch (e) {
      this.logger.error(e);
    }

    return { ...stock };
  }

  @Get('stocked/labels')
  async findStockedLabels(
    @Request() request: any,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let labels;
    try {
      const [data, total] = await this.stockLabelsService.findMany({
        where: { userId },
        include: { _count: { select: { Stocks: true } } },
        orderBy: [{ default: 'desc' }, { name: 'asc' }],
        skip: skip && skip > 0 ? skip : undefined,
        take: take && take > 0 ? take : undefined,
      });
      labels = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return labels;
  }

  @Post('stocked/labels')
  async createStockedLabel(@Request() request: any, @Body('name') name: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!name) {
      throw new UnprocessableEntityException();
    }

    let label;
    try {
      label = await this.stockLabelsService.create({
        data: { name, User: { connect: { id: userId } } },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException();
        }
        this.logger.error(JSON.stringify(e));
      } else {
        this.logger.error(e);
      }
      throw new InternalServerErrorException();
    }
    return { ...label };
  }

  @Get('stocked/labels/:labelId')
  async findStockedLabel(@Request() request: any, @Param('labelId') labelId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let label;
    try {
      label = await this.stockLabelsService.findFirst({ where: { id: labelId, userId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!label) {
      throw new NotFoundException();
    }
    return { ...label };
  }

  @Get('stocked/labels/:labelId/notes')
  async findStockedLabelNotes(
    @Request() request: any,
    @Param('labelId') labelId: string,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let label;
    try {
      label = await this.stockLabelsService.findFirst({ where: { id: labelId, userId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!label) {
      throw new NotFoundException();
    }

    let notes;
    try {
      const [data, total] = await this.stocksService.findMany({
        where: { labelId },
        orderBy: { createdAt: 'asc' },
        include: { Note: { include: { User: true, Group: true } } },
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

  @Put('stocked/labels/:labelId')
  async updateStockedLabel(
    @Request() request: any,
    @Param('labelId') labelId: string,
    @Body('name') name: string,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!name) {
      throw new UnprocessableEntityException();
    }

    let label;
    try {
      label = await this.stockLabelsService.update({
        where: { id: labelId, userId },
        data: { name },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException();
        }
        this.logger.error(JSON.stringify(e));
      } else {
        this.logger.error(e);
      }
      throw new InternalServerErrorException();
    }
    return { ...label };
  }

  @Delete('stocked/labels/:labelId')
  async deleteStockedLabel(@Request() request: any, @Param('labelId') labelId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let label;
    try {
      label = await this.stockLabelsService.delete({ where: { id: labelId, userId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return { ...label };
  }

  @Get('photo')
  async getPhoto(@Request() request: any, @Response() response: any) {
    const id = request.user.id;
    if (!id) {
      throw new UnauthorizedException();
    }

    try {
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob('user', `${id}/photo`);
      response.setHeader('Content-Type', downloadBlockBlobResponse.contentType);
      downloadBlockBlobResponse.readableStreamBody?.pipe(response);
    } catch (e) {
      if (e instanceof RestError) {
        if (e.statusCode === 404) {
          const png = jdenticon.toPng(request.user.id, 256, {
            padding: 0.15,
            backColor: '#F0F0F0',
            saturation: { color: 0.75 },
          });
          response.setHeader('Content-Type', 'image/png');
          response.setHeader('Content-Length', png.length);
          response.send(png);
        }
      }
      throw new InternalServerErrorException();
    }
  }

  @Post('photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Request() request: any,
    @Response() response: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    if (
      file.mimetype !== 'image/jpeg' &&
      file.mimetype !== 'image/gif' &&
      file.mimetype !== 'image/png'
    ) {
      throw new NotAcceptableException('Invalid file type');
    }
    if (file.size > 1024 * 128) {
      throw new PayloadTooLargeException('File too large');
    }
    try {
      const result = await this.blobsService.uploadBlob(
        'user',
        `${userId}/photo`,
        file.mimetype,
        file.buffer,
      );
      response.status(201).send({ ...result });
    } catch (e) {
      if (e instanceof RestError) {
        if (e.statusCode) {
          response.status(e.statusCode).send();
        }
        throw new InternalServerErrorException();
      }
    }
  }

  @Get('token')
  async getToken(@Request() request: any, @Response({ passthrough: true }) response: any) {
    const token = await Iron.seal(request.user, this.IRON_SECRET, Iron.defaults);
    response.cookie('filesToken', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/files/',
    });
    return {};
  }
}
