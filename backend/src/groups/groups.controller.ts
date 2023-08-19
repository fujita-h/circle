import { RestError } from '@azure/storage-blob';
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
  NotImplementedException,
  Param,
  ParseIntPipe,
  Patch,
  PayloadTooLargeException,
  Post,
  Query,
  Request,
  Response,
  UnauthorizedException,
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Prisma } from '@prisma/client';
import * as jdenticon from 'jdenticon';
import { AzblobService } from '../azblob/azblob.service';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { MembershipsService } from '../memberships/memberships.service';
import { NotesService } from '../notes/notes.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './groups.service';
import { UsersService } from '../users/users.service';
import { UpdateGroupMemberDto } from './dto/update-group-member.dto';
import { CreateGroupMemberDto } from './dto/create-group-member.dto';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('groups')
export class GroupsController {
  private logger = new Logger(GroupsController.name);
  private blobContainerName = 'group';

  constructor(
    private readonly groupsService: GroupsService,
    private readonly membershipsService: MembershipsService,
    private readonly notesService: NotesService,
    private readonly blobsService: AzblobService,
    private readonly usersService: UsersService,
  ) {
    this.logger.log('Initializing Groups Controller...');
    this.blobsService.init(this.blobContainerName);
  }

  checkHandle(handle: string) {
    if (!handle || !handle.match(/^[a-zA-Z][0-9a-zA-Z\-]{2,}$/i)) {
      throw new Error('Invalid handle');
    }
  }

  @Post()
  async create(@Request() request: any, @Body() data: CreateGroupDto) {
    const userId: string = request?.user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    try {
      this.checkHandle(data.handle);
    } catch (e) {
      throw new UnprocessableEntityException();
    }
    try {
      return await this.groupsService.create({
        data: {
          ...data,
          Members: { create: { User: { connect: { id: userId } }, role: 'ADMIN' } },
        },
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
  }

  @Get()
  async findMany(
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
  ) {
    let groups;
    try {
      const [data, total] = await this.groupsService.findMany({
        where: { handle: { not: null } },
        take: take && take > 0 ? take : undefined,
        skip: skip && skip > 0 ? skip : undefined,
      });
      groups = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return groups;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    let group;
    try {
      group = await this.groupsService.findFirst({
        where: { id, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }
    return group;
  }

  @Get(':id/photo')
  async getPhoto(@Param('id') id: string, @Response() response: any) {
    let group;
    try {
      group = await this.groupsService.findOne({ where: { id } });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }
    try {
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob(
        this.blobContainerName,
        `${id}/photo`,
      );
      response.setHeader('Content-Type', downloadBlockBlobResponse.contentType);
      downloadBlockBlobResponse.readableStreamBody?.pipe(response);
    } catch (e) {
      if (e instanceof RestError) {
        if (e.statusCode === 404) {
          const png = jdenticon.toPng(group.id, 256, {
            padding: 0.08,
            backColor: '#F0F0F0',
            saturation: { color: 0.25 },
          });
          response.setHeader('Content-Type', 'image/png');
          response.setHeader('Content-Length', png.length);
          response.send(png);
          return;
        }
      }
      throw new InternalServerErrorException();
    }
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('id') id: string,
    @Request() request: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = request?.user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let group;
    try {
      group = await this.groupsService.findOne({
        where: { id },
        include: { Members: true },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!group || !group.handle || group.status !== 'NORMAL') {
      throw new NotFoundException();
    }
    if (!group.Members) {
      throw new InternalServerErrorException();
    }
    if (!group.Members.find((m) => m.userId === userId && m.role === 'ADMIN')) {
      throw new ForbiddenException();
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
      return await this.blobsService.uploadBlob(
        this.blobContainerName,
        `${id}/photo`,
        file.mimetype,
        file.buffer,
      );
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
  }

  @Get(':id/members')
  async findMembers(
    @Param('id') id: string,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
  ) {
    // get group
    let group;
    try {
      group = await this.groupsService.findFirst({
        where: { id, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }

    // get memberships
    let memberships;
    try {
      const [data, total] = await this.membershipsService.findMany({
        where: {
          groupId: group.id,
        },
        take: take && take > 0 ? take : undefined,
        skip: skip && skip > 0 ? skip : undefined,
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
        include: { User: true },
      });
      memberships = { data, meta: { total } };
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!memberships) {
      throw new InternalServerErrorException();
    }

    // return result
    return memberships;
  }

  @Get(':id/members/:userId')
  async findOneMember(@Param('id') id: string, @Param('userId') userId: string) {
    // check group
    let group;
    try {
      group = await this.groupsService.findFirst({
        where: { id, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }

    // check user
    let user;
    try {
      user = await this.usersService.findFirst({
        where: { id: userId, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException();
    }

    // get membership
    let membership;
    try {
      membership = await this.membershipsService.findOne({
        where: { userId_groupId: { userId, groupId: group.id } },
        include: { User: true },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }

    // return result
    return { ...membership };
  }

  @Post(':id/members')
  async addMember(
    @Request() request: any,
    @Param('id') id: string,
    @Body() data: CreateGroupMemberDto,
  ) {
    // currently user must request to join group.
    // cannnot add member directly even if user is admin of group.
    throw new NotImplementedException();

    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let group;
    try {
      group = await this.groupsService.findFirst({
        where: { id, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }

    let accessMember;
    try {
      accessMember = await this.membershipsService.findFirst({
        where: { userId, groupId: group.id, role: 'ADMIN' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!accessMember) {
      throw new ForbiddenException();
    }

    let user;
    try {
      user = await this.usersService.findFirst({
        where: { id: data.userId, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new UnprocessableEntityException();
    }

    let membership;
    try {
      membership = await this.membershipsService.create({
        data: {
          User: { connect: { id: data.userId } },
          Group: { connect: { id } },
          role: data.role,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException();
        }
      }
      throw new InternalServerErrorException();
    }
    return { ...membership };
  }

  @Patch(':id/members/:userId')
  async updateMembership(
    @Request() request: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() data: UpdateGroupMemberDto,
  ) {
    const accessUserId = request.user.id;
    if (!accessUserId) {
      throw new UnauthorizedException();
    }

    let group;
    try {
      group = await this.groupsService.findFirst({
        where: { id, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }

    let user;
    try {
      user = await this.usersService.findFirst({
        where: { id: userId, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException();
    }

    let accessMember;
    try {
      accessMember = await this.membershipsService.findFirst({
        where: { userId: accessUserId, groupId: group.id, role: 'ADMIN' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!accessMember) {
      throw new ForbiddenException();
    }

    // cannot change role of last admin
    if (data.role !== 'ADMIN') {
      let adminMemberships;
      try {
        [adminMemberships] = await this.membershipsService.findMany({
          where: { groupId: group.id, role: 'ADMIN' },
        });
      } catch (e) {
        throw new InternalServerErrorException();
      }
      if (adminMemberships.length === 1 && adminMemberships[0].userId === userId) {
        throw new ForbiddenException('Cannot change role of last admin');
      }
    }

    let membership;
    try {
      membership = await this.membershipsService.update({
        where: { userId_groupId: { userId, groupId: group.id } },
        data: { role: data.role },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }

    if (!membership) {
      throw new NotFoundException();
    }

    return { ...membership };
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Request() request: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    const accessUserId = request.user.id;
    if (!accessUserId) {
      throw new UnauthorizedException();
    }

    let group;
    try {
      group = await this.groupsService.findFirst({
        where: { id, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }

    let user;
    try {
      user = await this.usersService.findFirst({
        where: { id: userId, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException();
    }

    let accessMember;
    try {
      accessMember = await this.membershipsService.findFirst({
        where: { userId: accessUserId, groupId: group.id, role: 'ADMIN' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!accessMember) {
      throw new ForbiddenException();
    }

    // cannot delete last admin
    let adminMemberships;
    try {
      [adminMemberships] = await this.membershipsService.findMany({
        where: { groupId: group.id, role: 'ADMIN' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (adminMemberships.length === 1 && adminMemberships[0].userId === userId) {
      throw new ForbiddenException('Cannot remove last admin');
    }

    let membership;
    try {
      membership = await this.membershipsService.delete({
        where: { userId_groupId: { userId, groupId: group.id } },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }

    if (!membership) {
      throw new NotFoundException();
    }

    return { ...membership };
  }

  @Get(':id/notes')
  async findNotes(
    @Request() request: any,
    @Param('id') id: string,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    let notes;
    try {
      const [data, total] = await this.notesService.findMany({
        where: {
          blobPointer: { not: null }, // only notes with blobPointer
          User: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
          groupId: id,
          OR: [
            { userId: userId }, // user is owner
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
        include: { User: true, Group: true, _count: { select: { Liked: true } } },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      });
      notes = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return notes;
  }

  @Get('handle/:handle')
  async findOneByHandle(@Request() request: any, @Param('handle') handle: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let group;
    try {
      group = await this.groupsService.findOne({
        where: { handle, status: 'NORMAL' },
        include: {
          _count: {
            select: {
              Members: true,
              Notes: {
                where: {
                  blobPointer: { not: null }, // only notes with blobPointer
                  User: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
                  //groupId: id,
                  OR: [
                    { userId: userId }, // user is owner
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
              },
            },
          },
        },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!group || group.status === 'DELETED') {
      throw new NotFoundException();
    }
    return group;
  }

  @Patch(':id')
  async update(@Request() request: any, @Param('id') id: string, @Body() data: UpdateGroupDto) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    // check permissions
    let group;
    try {
      group = await this.groupsService.findOne({ where: { id }, include: { Members: true } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    if (!group || group.status === 'DELETED') {
      throw new NotFoundException();
    }
    if (!group.Members) {
      throw new InternalServerErrorException();
    }

    const member = group.Members.find((m) => m.userId === userId);
    if (!member || member.role !== 'ADMIN') {
      throw new ForbiddenException();
    }

    if (data.handle) {
      try {
        this.checkHandle(data.handle);
      } catch (e) {
        throw new UnprocessableEntityException();
      }
    }

    let updatedGroup;
    try {
      updatedGroup = await this.groupsService.update({
        where: { id: group.id },
        data: { ...data },
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
    if (!updatedGroup) {
      throw new NotFoundException();
    }

    return updatedGroup;
  }

  @Delete(':id')
  async remove(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let group;
    try {
      group = await this.groupsService.findFirst({
        where: { id, handle: { not: null }, status: 'NORMAL' },
        include: { Members: true },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }

    if (!group.Members?.some((m) => m.userId === userId && m.role === 'ADMIN')) {
      throw new ForbiddenException();
    }

    try {
      // soft delete
      group = await this.groupsService.update({
        where: { id },
        data: { handle: null, status: 'DELETED' },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(JSON.stringify(e));
      } else {
        this.logger.error(e);
      }
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }

    return group;
  }
}
