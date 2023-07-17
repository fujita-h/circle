import {
  Controller,
  Logger,
  Request,
  Response,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpException,
  HttpStatus,
  Query,
  ParseIntPipe,
  NotFoundException,
  InternalServerErrorException,
  NotAcceptableException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { MembershipsService } from '../memberships/memberships.service';
import { NotesService } from '../notes/notes.service';
import { AzblobService } from '../azblob/azblob.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { RestError } from '@azure/storage-blob';
import * as jdenticon from 'jdenticon';

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
      this.logger.error(e);
      throw new NotAcceptableException();
    }

    let user;
    try {
      user = await this.usersService.create({ data });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    return user;
  }

  @Get()
  findMany(@Query('take', ParseIntPipe) take?: number, @Query('skip', ParseIntPipe) skip?: number) {
    let users;
    try {
      users = this.usersService.findMany({
        where: { handle: { not: null }, status: 'NORMAL' },
        orderBy: { handle: 'asc' },
        take,
        skip,
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return users;
  }

  @Get('count')
  async count() {
    let count;
    try {
      count = await this.usersService.count({
        where: { handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return count;
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

  @Get(':id/joined/circles')
  async findJoinedCircles(
    @Param('id') id: string,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    let memberships;
    try {
      memberships = await this.membershipsService.findMany({
        where: { userId: id, role: { in: ['ADMIN', 'MEMBER'] } },
        orderBy: { createdAt: 'asc' },
        include: { circle: true },
        skip,
        take,
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return memberships;
  }

  @Get(':id/joined/circles/count')
  async countJoinedCircles(@Param('id') id: string) {
    let count;
    try {
      count = await this.membershipsService.count({
        where: { userId: id, role: { in: ['ADMIN', 'MEMBER'] } },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return count;
  }

  @Get(':id/notes')
  async findNotes(
    @Request() request: any,
    @Param('id') id: string,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
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

    return this.notesService.findMany({
      where: {
        blobPointer: { not: null }, // only notes with blobPointer
        userId: id, // only notes of existing users
        OR: [
          { circleId: null },
          {
            status: 'NORMAL',
            circle: {
              readNotePermission: 'ADMIN',
              members: { some: { userId: userId, role: 'ADMIN' } },
            },
          }, // readNotePermission is ADMIN and user is admin of circle
          {
            status: 'NORMAL',
            circle: {
              readNotePermission: 'MEMBER',
              members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
            },
          }, // readNotePermission is MEMBER and user is member of circle
          {
            status: 'NORMAL',
            circle: { readNotePermission: 'ALL' },
          }, // readNotePermission is ALL
        ],
      },
      include: { user: true, circle: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  @Get(':id/notes/count')
  async countNotes(@Request() request: any, @Param('id') id: string) {
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

    let count;
    try {
      count = await this.notesService.count({
        where: {
          blobPointer: { not: null }, // only notes with blobPointer
          userId: id, // only notes of existing users
          OR: [
            { circleId: null },
            {
              status: 'NORMAL',
              circle: {
                readNotePermission: 'ADMIN',
                members: { some: { userId: userId, role: 'ADMIN' } },
              },
            }, // readNotePermission is ADMIN and user is admin of circle
            {
              status: 'NORMAL',
              circle: {
                readNotePermission: 'MEMBER',
                members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
              },
            }, // readNotePermission is MEMBER and user is member of circle
            {
              status: 'NORMAL',
              circle: { readNotePermission: 'ALL' },
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

  @Get('handle/:handle/joined/circles')
  async findJoinedCirclesByHandle(
    @Param('handle') handle: string,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    let user;
    try {
      user = await this.usersService.findOne({ where: { handle } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException();
    }
    return this.findJoinedCircles(user.id, skip, take);
  }

  @Get('handle/:handle/joined/circles/count')
  async countJoinedCirclesByHandle(@Param('handle') handle: string) {
    let user;
    try {
      user = await this.usersService.findOne({ where: { handle } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException();
    }
    return this.countJoinedCircles(user.id);
  }

  @Get('handle/:handle/notes')
  async findNotesByHandle(
    @Request() request: any,
    @Param('handle') handle: string,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    let id;
    try {
      id = await this.usersService.findOne({ where: { handle } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!id) {
      throw new NotFoundException();
    }
    return this.findNotes(request, id.id, skip, take);
  }

  @Get('handle/:handle/notes/count')
  async countNotesByHandle(@Request() request: any, @Param('handle') handle: string) {
    let id;
    try {
      id = await this.usersService.findOne({ where: { handle } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!id) {
      throw new NotFoundException();
    }
    return this.countNotes(request, id.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    try {
      this.checkHandle(data.handle);
    } catch (e) {
      this.logger.error(e);
      throw new NotAcceptableException();
    }

    let user;
    try {
      user = await this.usersService.update({ where: { id }, data });
    } catch (e) {
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
        data: { oid: null, handle: null, status: 'DELETED', joined: { set: [] } },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }
}
