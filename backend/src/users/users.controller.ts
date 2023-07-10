import {
  Controller,
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
  constructor(
    private readonly usersService: UsersService,
    private readonly membershipsService: MembershipsService,
    private readonly notesService: NotesService,
    private readonly blobsService: AzblobService,
  ) {
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
      return await this.usersService.create({ data });
    } catch (e) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: e.message || e || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  findMany(@Query('take', ParseIntPipe) take?: number, @Query('skip', ParseIntPipe) skip?: number) {
    return this.usersService.findMany({
      where: { OR: [{ handle: { not: null } }, { status: 'NORMAL' }] },
      take,
      skip,
    });
  }

  @Get('count')
  async count() {
    return this.usersService.count({
      where: { OR: [{ handle: { not: null } }, { status: 'NORMAL' }] },
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.usersService.findOne({ where: { id } });
    } catch (e) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: e.message || e || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/photo')
  async getPhoto(@Param('id') id: string, @Response() response: any) {
    const user = await this.usersService.findOne({ where: { id } });
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

  @Get('handle/:handle')
  async findOneByHandle(@Param('handle') handle: string) {
    return await this.usersService.findOne({ where: { handle } });
  }

  @Get('handle/:handle/joined/circles')
  async findJoinedCirclesByHandle(
    @Request() request: any,
    @Param('handle') handle: string,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    return this.membershipsService.findMany({
      where: { user: { handle }, role: { in: ['ADMIN', 'MEMBER'] } },
      orderBy: { createdAt: 'asc' },
      include: { circle: true },
      skip,
      take,
    });
  }

  @Get('handle/:handle/joined/circles/count')
  async countJoinedCirclesByHandle(@Request() request: any, @Param('handle') handle: string) {
    return this.membershipsService.count({
      where: { user: { handle }, role: { in: ['ADMIN', 'MEMBER'] } },
    });
  }

  @Get('handle/:handle/notes')
  async findNotesByHandle(
    @Request() request: any,
    @Param('handle') handle: string,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    return this.notesService.findMany({
      where: {
        user: { handle, status: 'NORMAL' },
        status: 'NORMAL',
        blobPointer: { not: null }, // only notes with blobPointer
        circle: { handle: { not: null }, status: 'NORMAL' }, // only notes in existing circles
        OR: [
          {
            // user is member of circle
            circle: {
              members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } },
            },
          },
          { circle: { type: { in: ['OPEN', 'PUBLIC'] } } }, // circle is open or public
        ],
      },
      include: { user: true, circle: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  @Get('handle/:handle/notes/count')
  async countNotesByHandle(@Request() request: any, @Param('handle') handle: string) {
    const userId = request.user.id;
    return this.notesService.count({
      where: {
        user: { handle, status: 'NORMAL' },
        status: 'NORMAL',
        blobPointer: { not: null }, // only notes with blobPointer
        circle: { handle: { not: null }, status: 'NORMAL' }, // only notes in existing circles
        OR: [
          {
            // user is member of circle
            circle: {
              members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } },
            },
          },
          { circle: { type: { in: ['OPEN', 'PUBLIC'] } } }, // circle is open or public
        ],
      },
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    try {
      this.checkHandle(data.handle);
      return await this.usersService.update({ where: { id }, data });
    } catch (e) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: e.message || e || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      // soft delete
      return await this.usersService.update({
        where: { id },
        data: { oid: null, handle: null, status: 'DELETED', joined: { set: [] } },
      });
    } catch (e) {
      console.error(e);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: e.message || e || 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
