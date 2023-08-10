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
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  Response,
  UnauthorizedException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as jdenticon from 'jdenticon';
import { AzblobService } from '../azblob/azblob.service';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { MembershipsService } from '../memberships/memberships.service';
import { NotesService } from '../notes/notes.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('users')
export class UsersController {
  private logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly membershipsService: MembershipsService,
    private readonly notesService: NotesService,
    private readonly blobsService: AzblobService,
  ) {
    this.logger.log('Initializing Users Controller...');
    this.blobsService.init('user');
  }

  checkHandle(handle: string) {
    if (!handle || !handle.match(/^[a-zA-Z][0-9a-zA-Z\-]{2,}$/i)) {
      throw new Error('Invalid handle');
    }
  }

  @Post()
  async create(@Body() data: CreateUserDto) {
    try {
      this.checkHandle(data.handle);
    } catch (e) {
      throw new UnprocessableEntityException();
    }

    let user;
    try {
      user = await this.usersService.create({ data });
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
    return user;
  }

  @Get()
  async findMany(
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
  ) {
    let users;
    try {
      const [data, total] = await this.usersService.findMany({
        where: { handle: { not: null }, status: 'NORMAL' },
        orderBy: { handle: 'asc' },
        take: take && take > 0 ? take : undefined,
        skip: skip && skip > 0 ? skip : undefined,
      });
      users = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return users;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    let user;
    try {
      user = await this.usersService.findFirst({
        where: { id, handle: { not: null }, status: 'NORMAL' },
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

  @Get(':id/photo')
  async getPhoto(@Param('id') id: string, @Response() response: any) {
    let user;
    try {
      user = await this.usersService.findFirst({
        where: { id, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException();
    }
    try {
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob('user', `${id}/photo`);
      response.setHeader('Content-Type', downloadBlockBlobResponse.contentType);
      downloadBlockBlobResponse.readableStreamBody?.pipe(response);
    } catch (e) {
      if (e instanceof RestError) {
        if (e.statusCode === 404) {
          const png = jdenticon.toPng(user.id, 256, {
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

  @Get(':id/joined/groups')
  async findJoinedGroups(
    @Param('id') id: string,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
  ) {
    let memberships;
    try {
      const [data, total] = await this.membershipsService.findMany({
        where: { userId: id, role: { in: ['ADMIN', 'MEMBER'] } },
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

  @Get(':id/notes')
  async findNotes(
    @Request() request: any,
    @Param('id') id: string,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let user;
    try {
      user = await this.usersService.findFirst({
        where: { id, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException();
    }

    let notes;
    try {
      const [data, total] = await this.notesService.findMany({
        where: {
          blobPointer: { not: null }, // only notes with blobPointer
          userId: id, // only notes of existing users
          OR: [
            { groupId: null },
            {
              status: 'NORMAL',
              Group: {
                readNotePermission: 'ADMIN',
                Members: { some: { userId: userId, role: 'ADMIN' } },
              },
            }, // readNotePermission is ADMIN and user is admin of group
            {
              status: 'NORMAL',
              Group: {
                readNotePermission: 'MEMBER',
                Members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
              },
            }, // readNotePermission is MEMBER and user is member of group
            {
              status: 'NORMAL',
              Group: { readNotePermission: 'ALL' },
            }, // readNotePermission is ALL
          ],
        },
        include: { User: true, Group: true },
        orderBy: [{ createdAt: 'desc' }, { createdAt: 'desc' }],
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

  @Get('handle/:handle')
  async findOneByHandle(@Param('handle') handle: string) {
    let user;
    try {
      user = await this.usersService.findFirst({
        where: { handle, status: 'NORMAL' },
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

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    try {
      this.checkHandle(data.handle);
    } catch (e) {
      this.logger.error(e);
      throw new UnprocessableEntityException();
    }

    let user;
    try {
      user = await this.usersService.update({ where: { id }, data });
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
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  @Delete(':id')
  async remove(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let user;
    try {
      user = await this.usersService.findFirst({
        where: { id, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException();
    }

    if (user.id !== userId) {
      throw new ForbiddenException();
    }

    try {
      // soft delete
      user = await this.usersService.update({
        where: { id },
        data: { oid: null, handle: null, status: 'DELETED', Joined: { set: [] } },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(JSON.stringify(e));
      } else {
        this.logger.error(e);
      }
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }
}
