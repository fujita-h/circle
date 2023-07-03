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
import { UserGroupsService } from '../user-groups/user-groups.service';
import { ItemsService } from '../items/items.service';
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
    private readonly userGroupsService: UserGroupsService,
    private readonly itemsService: ItemsService,
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

  @Get('handle/:handle/joined/groups')
  async findJoinedGroupsByHandle(
    @Request() request: any,
    @Param('handle') handle: string,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    return this.userGroupsService.findMany({
      where: { user: { handle }, role: { in: ['ADMIN', 'MEMBER'] } },
      orderBy: { createdAt: 'asc' },
      include: { group: true },
      skip,
      take,
    });
  }

  @Get('handle/:handle/joined/groups/count')
  async countJoinedGroupsByHandle(@Request() request: any, @Param('handle') handle: string) {
    return this.userGroupsService.count({
      where: { user: { handle }, role: { in: ['ADMIN', 'MEMBER'] } },
    });
  }

  @Get('handle/:handle/items')
  async findItemsByHandle(
    @Request() request: any,
    @Param('handle') handle: string,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    return this.itemsService.findMany({
      where: {
        user: { handle, status: 'NORMAL' },
        status: 'NORMAL',
        blobPointer: { not: null }, // only items with blobPointer
        group: { handle: { not: null }, status: 'NORMAL' }, // only items in existing groups
        OR: [
          {
            // user is member of group
            group: {
              members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } },
            },
          },
          { group: { type: { in: ['OPEN', 'PUBLIC'] } } }, // group is open or public
        ],
      },
      include: { user: true, group: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  @Get('handle/:handle/items/count')
  async countItemsByHandle(@Request() request: any, @Param('handle') handle: string) {
    const userId = request.user.id;
    return this.itemsService.count({
      where: {
        user: { handle, status: 'NORMAL' },
        status: 'NORMAL',
        blobPointer: { not: null }, // only items with blobPointer
        group: { handle: { not: null }, status: 'NORMAL' }, // only items in existing groups
        OR: [
          {
            // user is member of group
            group: {
              members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } },
            },
          },
          { group: { type: { in: ['OPEN', 'PUBLIC'] } } }, // group is open or public
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
        data: { oid: null, handle: null, status: 'DELETED', joinedGroups: { set: [] } },
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
