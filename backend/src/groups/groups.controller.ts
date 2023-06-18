import {
  Controller,
  Logger,
  UseGuards,
  Request,
  Response,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  Query,
  Put,
  ParseIntPipe,
  NotAcceptableException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { ItemsService } from '../items/items.service';
import { AzblobService } from '../azblob/azblob.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupItemDto } from './dto/create-group-item.dto';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { RestError } from '@azure/storage-blob';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('groups')
export class GroupsController {
  private logger = new Logger(GroupsController.name);

  constructor(
    private readonly groupsService: GroupsService,
    private readonly itemsService: ItemsService,
    private readonly blobsService: AzblobService,
  ) {
    this.blobsService.init('group');
  }

  checkHandle(handle: string) {
    if (!handle || !handle.match(/^[a-zA-Z][0-9a-zA-Z\-]{2,}$/i)) {
      throw new Error('Invalid handle');
    }
  }

  @Post()
  async create(@Request() request: any, @Body() data: CreateGroupDto) {
    try {
      this.checkHandle(data.handle);
      const userId = request.user.id;
      return await this.groupsService.create({
        data: {
          ...data,
          members: { create: { user: { connect: { id: userId } }, role: 'ADMIN' } },
        },
      });
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
    return this.groupsService.findMany({ where: { handle: { not: null } }, take, skip });
  }

  @Get('count')
  count() {
    return this.groupsService.count({ where: { handle: { not: null } } });
  }

  @Get('types/open')
  findOpenMany(
    @Query('take', ParseIntPipe) take?: number,
    @Query('skip', ParseIntPipe) skip?: number,
  ) {
    return this.groupsService.findMany({
      where: { type: 'OPEN', handle: { not: null } },
      take,
      skip,
    });
  }

  @Get('types/open/count')
  countOpen() {
    return this.groupsService.count({ where: { type: 'OPEN', handle: { not: null } } });
  }

  @Get('/types/public')
  findPublicMany(
    @Query('take', ParseIntPipe) take?: number,
    @Query('skip', ParseIntPipe) skip?: number,
  ) {
    return this.groupsService.findMany({
      where: { type: 'PUBLIC', handle: { not: null } },
      take,
      skip,
    });
  }

  @Get('/types/public/count')
  countPublic() {
    return this.groupsService.count({ where: { type: 'PUBLIC', handle: { not: null } } });
  }

  @Get('/types/private')
  findPrivateMany(
    @Query('take', ParseIntPipe) take?: number,
    @Query('skip', ParseIntPipe) skip?: number,
  ) {
    return this.groupsService.findMany({
      where: { type: 'PRIVATE', handle: { not: null } },
      take,
      skip,
    });
  }

  @Get('/types/private/count')
  countPrivate() {
    return this.groupsService.count({ where: { type: 'PRIVATE', handle: { not: null } } });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.groupsService.findFirst({ where: { id, handle: { not: null } } });
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
    try {
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob(
        'group',
        `${id}/photo`,
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

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('id') id: string,
    @Request() request: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const group = await this.groupsService.findFirst({ where: { id } });
    if (!group || !group.handle || group.status === 'DELETED') {
      throw new NotFoundException();
    }
    if (
      file.mimetype !== 'image/jpeg' &&
      file.mimetype !== 'image/gif' &&
      file.mimetype !== 'image/png'
    ) {
      throw new NotAcceptableException('Invalid file type');
    }
    if (file.size > 1024 * 128) {
      throw new NotAcceptableException('File too large');
    }
    try {
      return this.blobsService.uploadBlob('group', `${id}/photo`, file.mimetype, file.buffer);
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  @Get('handle/:handle')
  async FindOneByHandle(@Param('handle') handle: string) {
    const group = await this.groupsService.findOne({ where: { handle } });
    if (!group || group.status === 'DELETED') {
      throw new NotFoundException();
    }
    return group;
  }

  @Get('handle/:handle/photo')
  async getPhotoByHandle(@Param('handle') handle: string, @Response() response: any) {
    const group = await this.FindOneByHandle(handle);
    if (!group || !group.id) {
      throw new NotFoundException();
    }
    const id = group.id;
    try {
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob(
        'group',
        `${id}/photo`,
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

  @Get(':id/items')
  async findItems(
    @Request() request: any,
    @Param('id') id: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const userId = request.user.id;
    try {
      return await this.itemsService.findMany({
        where: {
          status: 'NORMAL',
          group: {
            id: id, // item belongs to the group
            handle: { not: null }, // group has a handle (not deleted)
          },
          user: { handle: { not: null } }, // item belongs to an existing user
          OR: [
            { user: { id: userId } }, // you are owner
            {
              // you are member of the group
              group: {
                members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } },
              },
            },
            { group: { type: { in: ['OPEN', 'PUBLIC'] } } }, // group is open or public
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
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

  @Get('handle/:handle/items')
  async findItemsByHandle(
    @Request() request: any,
    @Param('handle') handle: string,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    if (!handle) {
      throw new NotAcceptableException('Invalid handle');
    }

    const check = await this.groupsService.findFirst({
      where: {
        handle,
        OR: [
          { members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } } }, // you are member of the group
          { type: { in: ['OPEN', 'PUBLIC'] } }, // group is open or public
        ],
      },
    });

    if (!check) {
      throw new ForbiddenException('You are not allowed to access this group items');
    }

    return this.itemsService.findMany({
      where: {
        status: 'NORMAL',
        blobPointer: { not: null },
        group: { handle: handle },
        user: { handle: { not: null } }, // item belongs to an existing user
        OR: [
          {
            // you are member of the group
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
        status: 'NORMAL',
        blobPointer: { not: null },
        group: { handle: handle },
        user: { handle: { not: null } }, // item belongs to an existing user
        OR: [
          {
            // you are member of the group
            group: {
              members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } },
            },
          },
          { group: { type: { in: ['OPEN', 'PUBLIC'] } } }, // group is open or public
        ],
      },
    });
  }

  @Get('handle/:handle/members')
  async findMembersByHandle(
    @Request() request: any,
    @Param('handle') handle: string,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    if (!handle) {
      throw new NotAcceptableException('Invalid handle');
    }

    return this.groupsService.findMembers({
      where: {
        group: {
          handle,
          status: 'NORMAL',
          OR: [
            { members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } } }, // you are member of the group
            { type: { in: ['OPEN', 'PUBLIC'] } }, // group is open or public
          ],
        },
      },
      include: { user: true },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      take,
      skip,
    });
  }

  @Get('handle/:handle/members/count')
  async countMembersByHandle(@Request() request: any, @Param('handle') handle: string) {
    const userId = request.user.id;
    if (!handle) {
      throw new NotAcceptableException('Invalid handle');
    }

    return this.groupsService.countMembers({
      where: {
        group: {
          handle,
          status: 'NORMAL',
          OR: [
            { members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } } }, // you are member of the group
            { type: { in: ['OPEN', 'PUBLIC'] } }, // group is open or public
          ],
        },
      },
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateGroupDto) {
    try {
      this.checkHandle(data.handle);
      return await this.groupsService.update({ where: { id }, data: { ...data, type: undefined } });
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
      return await this.groupsService.update({
        where: { id },
        data: { handle: null, status: 'DELETED' },
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
