import {
  Controller,
  Get,
  UseGuards,
  Request,
  Response,
  Query,
  ParseIntPipe,
  HttpStatus,
  NotFoundException,
  NotAcceptableException,
  HttpException,
  Param,
  Post,
  Body,
  Put,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { ItemsService } from '../items/items.service';
import { GroupsService } from '../groups/groups.service';
import { AzblobService } from '../azblob/azblob.service';
import { CreateItemDto } from '../items/dto/create-item.dto';
import { UpdateItemDto } from '../items/dto/update-item.dto';
import { RestError } from '@azure/storage-blob';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('drafts')
export class DraftsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly groupsService: GroupsService,
    private readonly blobsService: AzblobService,
  ) {}

  @Post()
  async create(@Request() request: any, @Body() data: CreateItemDto) {
    const userId = request.user.id;
    const groupId = data.group.id;

    // some checks if group is exists
    if (groupId) {
      const group = await this.groupsService.findOne({
        where: { id: groupId },
        include: { members: true },
      });

      // if group is not exists, throw error
      if (!group) {
        throw new BadRequestException();
      }

      // if group is private or public, check if user is member
      if (group.type === 'PUBLIC' || group.type === 'PRIVATE') {
        if (group.members?.filter((m) => m.userId === userId).length === 0) {
          throw new BadRequestException();
        }
      }
    }

    return await this.itemsService.createDraft({
      data: {
        user: { connect: { id: userId } },
        group: groupId ? { connect: { id: groupId } } : undefined,
        title: data.title,
        status: data.status,
      },
      body: data.body,
    });
  }

  @Get()
  findMany(
    @Request() request: any,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    return this.itemsService.findMany({
      where: {
        status: 'NORMAL',
        draftPointer: { not: null },
        user: { id: userId },
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true, group: true },
      skip,
      take,
    });
  }

  @Get('count')
  count(@Request() request: any) {
    const userId = request.user.id;
    return this.itemsService.count({
      where: {
        status: 'NORMAL',
        draftPointer: { not: null },
        user: { id: userId },
      },
    });
  }

  @Get(':id')
  async findOne(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.id;
    const result = await this.itemsService.findFirst({
      where: {
        id: id,
        status: 'NORMAL',
        draftPointer: { not: null },
        user: { id: userId },
      },
      include: { user: true, group: true },
    });
    if (!result) {
      throw new NotFoundException();
    }
    return result;
  }

  @Get(':id/md')
  async getMarkdown(@Request() request: any, @Param('id') id: string, @Response() response: any) {
    const userId = request.user.id;
    try {
      const item = await this.itemsService.findFirst({
        where: {
          id,
          status: 'NORMAL',
          draftPointer: { not: null },
          user: { id: userId },
        },
      });

      if (!item) {
        throw new Error('Item not found');
      }
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob(
        'item',
        `${item.id}/${item.draftPointer}.draft.md`,
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

    //check input
    if (!id || !userId) {
      throw new BadRequestException();
    }

    //check if item exists
    const item = await this.itemsService.findFirst({
      where: {
        id,
        user: { id: userId }, // user is owner
      },
      include: { user: true, group: true },
    });

    if (!item || !item.user) {
      throw new NotFoundException();
    }

    //update item
    const group = data.group?.id ? { connect: { id: data.group.id } } : { disconnect: true };
    return await this.itemsService.updateDraft({
      where: { id },
      data: {
        title: data.title,
        user: { connect: { id: userId } },
        group: group,
        status: data.status,
      },
      body: data.body,
    });
  }
}
