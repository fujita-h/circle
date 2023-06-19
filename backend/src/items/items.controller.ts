import {
  Controller,
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
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { AuthorizedRolesAny } from '../guards/jwt.roles.decorator';
import { AzblobService } from '../azblob/azblob.service';
import { CreateItemDto } from './dto/create-item.dto';
import { GroupsService } from '../groups/groups.service';
import { RestError } from '@azure/storage-blob';
import { EsService } from '../es/es.service';
import { SearchRequest } from '@elastic/elasticsearch/lib/api/types';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly groupService: GroupsService,
    private readonly blobsService: AzblobService,
    private readonly esService: EsService,
  ) {}

  @Post()
  async create(@Request() request: any, @Body() data: CreateItemDto) {
    const userId = request.user.id;
    const groupId = data.group.id;

    // check input
    if (!userId || !groupId) {
      throw new BadRequestException();
    }

    // check group
    const group = await this.groupService.findOne({
      where: { id: groupId },
      include: { members: true },
    });

    // if group is not exists, throw error
    if (!group) {
      throw new BadRequestException();
    }

    // check if user is member
    if (
      group.members === undefined ||
      group.members.filter((m) => m.userId === userId).length === 0
    ) {
      throw new ForbiddenException("You're not allowed to create items in this group");
    }

    return await this.itemsService.create({
      data: {
        user: { connect: { id: userId } },
        group: { connect: { id: groupId } },
        title: data.title,
        status: data.status,
      },
      body: data.body,
    });
  }

  @Get()
  findItems(
    @Request() request: any,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    return this.itemsService.findMany({
      where: {
        status: 'NORMAL',
        blobPointer: { not: null }, // only items with blobPointer
        group: { handle: { not: null }, status: 'NORMAL' }, // only items in existing groups
        user: { handle: { not: null }, status: 'NORMAL' }, // only items of existing users
        OR: [
          { user: { id: userId } }, // user is owner
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

  @Get('count')
  async countItems(@Request() request: any) {
    const userId = request.user.id;
    return this.itemsService.count({
      where: {
        status: 'NORMAL',
        blobPointer: { not: null }, // only items with blobPointer
        group: { handle: { not: null }, status: 'NORMAL' }, // only items in existing groups
        user: { handle: { not: null }, status: 'NORMAL' }, // only items of existing users
        OR: [
          { user: { id: userId } }, // user is owner
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

  @Get('search')
  async search(
    @Request() request: any,
    @Query('q') q: string,
    @Query('skip', ParseIntPipe) skip: number,
    @Query('take', ParseIntPipe) take: number,
  ) {
    const userId = request.user.id;
    const groups = await this.groupService.findMany({
      where: {
        status: 'NORMAL',
        handle: { not: null }, // only groups with handle
        OR: [
          { members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } } }, // user is member of group
          { type: { in: ['OPEN', 'PUBLIC'] } }, // group is open or public
        ],
      },
    });
    const groupIds = groups.map((g) => g.id);
    const body: SearchRequest = {
      query: {
        bool: {
          must: [
            { terms: { groupId: groupIds } },
            q ? { multi_match: { query: q || '', fields: ['title', 'body'] } } : { match_all: {} },
          ],
        },
      },
      sort: [{ createdAt: 'desc' }],
      from: skip,
      size: take,
    };
    const result = await this.esService.search('item', body);
    return result?.hits?.hits || [];
  }

  @Get(':id')
  async findOne(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.id;

    // check input
    if (!id || !userId) {
      throw new BadRequestException();
    }

    // retrieve item
    const item = await this.itemsService.findOne({
      where: { id },
      include: { user: true, group: true },
    });

    // check item
    if (
      !item ||
      !item.user ||
      item.user.handle === null ||
      item.user.status === 'DELETED' ||
      !item.group ||
      item.group.handle === null ||
      item.group.status === 'DELETED' ||
      item.status === 'DELETED' ||
      item.blobPointer === null
    ) {
      throw new NotFoundException();
    }

    // retrieve group
    const group = await this.groupService.findOne({
      where: { id: item.group.id },
      include: { members: true },
    });

    // check group
    if (!group || group.status === 'DELETED' || group.handle === null) {
      throw new NotFoundException();
    }

    // allow access if user is owner
    if (item.user.id === userId) {
      if (group.members?.find((m) => m.userId === userId)) {
        // allow edit if user is owner and user is member of group
        return { ...item, canEdit: true };
      } else {
        return item;
      }
    }

    // allow access if group is open or public
    if (item.group.type === 'OPEN' || item.group.type === 'PUBLIC') {
      return item;
    }

    // allow access if user is member of private group
    if (item.group.type === 'PRIVATE') {
      if (group.members?.find((m) => m.userId === userId)) {
        return item;
      }
    }

    // if none of the above, throw exception
    throw new ForbiddenException("You're not allowed to view this item");
  }

  @Get(':id/md')
  async getMarkdown(@Request() request: any, @Param('id') id: string, @Response() response: any) {
    const item = await this.findOne(request, id);
    if (!item) {
      throw new Error('Item not found');
    }

    try {
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob(
        'item',
        `${item.id}/${item.blobPointer}.md`,
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

  @Put(':id')
  async update(@Request() request: any, @Param('id') id: string, @Body() data: UpdateItemDto) {
    const userId = request.user.id;
    const groupId = data.group.id;

    //check input
    if (!id || !userId || !groupId) {
      throw new BadRequestException();
    }

    // retrieve item
    const item = await this.itemsService.findOne({
      where: { id },
      include: { user: true, group: true },
    });

    // check item
    if (!item || !item.user || item.status === 'DELETED') {
      throw new NotFoundException();
    }

    // check if user is owner
    if (item.userId !== userId) {
      throw new ForbiddenException("You're not allowed to update this item");
    }

    // check group
    const group = await this.groupService.findOne({
      where: { id: groupId },
      include: { members: true },
    });

    // if group is not exists, throw error
    if (!group) {
      throw new BadRequestException();
    }

    // check if user is member
    if (
      group.members === undefined ||
      group.members.filter((m) => m.userId === userId).length === 0
    ) {
      throw new ForbiddenException("You're not allowed to create items in this group");
    }

    //update item
    return await this.itemsService.update({
      where: { id },
      data: {
        title: data.title,
        user: { connect: { id: userId } },
        group: { connect: { id: groupId } },
        status: data.status,
      },
      body: data.body,
    });
  }

  @Delete(':id')
  async remove(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.id;

    // check input
    if (!id || !userId) {
      throw new BadRequestException();
    }

    // retrieve item
    const item = await this.itemsService.findOne({
      where: { id },
      include: { user: true, group: true },
    });

    // check item
    if (!item || !item.user || !item.group || item.status === 'DELETED') {
      throw new NotFoundException();
    }

    // check permissions
    let allowUpdate = false;

    // allow access if user is owner
    if (item.user.id === userId) {
      allowUpdate = true;
    }

    // throw exception if not allowed
    if (!allowUpdate) {
      throw new ForbiddenException("You're not allowed to delete this item");
    }

    return this.itemsService.softRemove({ where: { id: item.id } });
  }
}
