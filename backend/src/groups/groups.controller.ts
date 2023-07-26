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
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take: number,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip: number,
  ) {
    let groups;
    try {
      const [data, total] = await this.groupsService.findMany({
        where: { handle: { not: null } },
        take: take > 0 ? take : undefined,
        skip: skip > 0 ? skip : undefined,
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
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take: number,
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
        take: take > 0 ? take : undefined,
        skip: skip > 0 ? skip : undefined,
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

  @Get(':id/notes')
  async findNotes(
    @Request() request: any,
    @Param('id') id: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
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
        include: { User: true, Group: true },
        orderBy: { createdAt: 'desc' },
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
  async findOneByHandle(@Param('handle') handle: string) {
    let group;
    try {
      group = await this.groupsService.findOne({ where: { handle } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!group || group.status === 'DELETED') {
      throw new NotFoundException();
    }
    return group;
  }

  @Get('handle/:handle/photo')
  async getPhotoByHandle(@Param('handle') handle: string, @Response() response: any) {
    const group = await this.groupsService.findOne({ where: { handle } });
    if (!group || !group.id) {
      throw new NotFoundException();
    }
    return this.getPhoto(group.id, response);
  }

  @Get('handle/:handle/members')
  async findMembersByHandle(
    @Param('handle') handle: string,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take: number,
  ) {
    let group;
    try {
      group = await this.groupsService.findOne({ where: { handle } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!group || group.status === 'DELETED') {
      throw new NotFoundException();
    }

    return this.findMembers(group.id, skip, take);
  }

  @Get('handle/:handle/notes')
  async findNotesByHandle(
    @Request() request: any,
    @Param('handle') handle: string,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take: number,
  ) {
    let group;
    try {
      group = await this.groupsService.findOne({ where: { handle } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!group || group.status === 'DELETED') {
      throw new NotFoundException();
    }

    return this.findNotes(request, group.id, skip, take);
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
