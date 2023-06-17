import {
  Controller,
  Request,
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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ItemsService } from '../items/items.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly itemsService: ItemsService,
  ) {}

  @Post()
  async create(@Body() data: CreateUserDto) {
    try {
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

  @Get('handle/:handle')
  async findOneByHandle(@Param('handle') handle: string) {
    return await this.usersService.findOne({ where: { handle } });
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
