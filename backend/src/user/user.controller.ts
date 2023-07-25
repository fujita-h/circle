import {
  Controller,
  Logger,
  UseGuards,
  Request,
  Response,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  NotAcceptableException,
  InternalServerErrorException,
  Put,
  Query,
  ParseIntPipe,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  DefaultValuePipe,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';
import * as Iron from '@hapi/iron';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { MembershipsService } from '../memberships/memberships.service';
import { AzblobService } from '../azblob/azblob.service';
import { NotesService } from '../notes/notes.service';
import { LikesService } from '../likes/likes.service';
import { StocksService } from '../stocks/stocks.service';
import { StockLabelsService } from '../stock-labels/stock-labels.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { RestError } from '@azure/storage-blob';
import * as jdenticon from 'jdenticon';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('user')
export class UserController {
  private logger = new Logger(UserController.name);
  private IRON_SECRET: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly membershipsService: MembershipsService,
    private readonly blobsService: AzblobService,
    private readonly notesService: NotesService,
    private readonly likesService: LikesService,
    private readonly stocksService: StocksService,
    private readonly stockLabelsService: StockLabelsService,
  ) {
    if (!this.configService.get<string>('IRON_SECRET')) {
      this.logger.error('IRON_SECRET is not defined');
      throw new Error('IRON_SECRET is not defined');
    }
    this.IRON_SECRET = this.configService.get<string>('IRON_SECRET') || '';
  }

  checkHandle(handle: string) {
    if (!handle || !handle.match(/^[a-zA-Z][0-9a-zA-Z\-]{2,}$/i)) {
      throw new Error('Invalid handle');
    }
  }

  @Get()
  async findOne(@Request() request: any) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let user;
    try {
      user = await this.usersService.findOne({ where: { id: userId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  @Patch()
  async update(@Request() request: any, @Body() data: UpdateUserDto) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (data.handle) {
      try {
        this.checkHandle(data.handle);
      } catch (e) {
        throw new NotAcceptableException();
      }
    }

    let user;
    try {
      user = await this.usersService.update({
        where: { id: userId },
        data: {
          handle: data.handle ?? undefined,
          name: data.name ?? undefined,
          email: data.email ?? undefined,
        },
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

  @Get('groups/postable')
  async findPostable(@Request() request: any) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let groups;
    try {
      const [data] = await this.groupsService.findMany({
        where: {
          status: 'NORMAL',
          handle: { not: null },
          Members: { some: { User: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } },
        },
      });
      groups = data;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return groups;
  }

  @Get('joined/groups')
  async findJoinedGroups(
    @Request() request: any,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take: number,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let memberships;
    try {
      const [data, total] = await this.membershipsService.findMany({
        where: { userId, role: { in: ['ADMIN', 'MEMBER'] } },
        orderBy: { createdAt: 'asc' },
        include: { Group: true },
        skip: skip > 0 ? skip : undefined,
        take: take > 0 ? take : undefined,
      });
      memberships = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return memberships;
  }

  /** @deprecated */
  @Get('joined/groups/handle/:handle')
  async findJoinedGroupByHandle(@Request() request: any, @Param('handle') handle: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let membership;
    try {
      membership = await this.membershipsService.findFirst({
        where: { userId, role: { in: ['ADMIN', 'MEMBER'] }, Group: { handle } },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!membership) {
      throw new NotFoundException();
    }
    return membership;
  }

  @Put('joined/groups/:groupId')
  async joinGroup(@Request() request: any, @Param('groupId') groupId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let group;
    try {
      group = await this.groupsService.findOne({ where: { id: groupId } });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }

    if (group.joinGroupCondition === 'DENIED') {
      throw new ForbiddenException();
    }

    const role =
      group.joinGroupCondition === 'REQUIRE_ADMIN_APPROVAL' ? 'PENDING_APPROVAL' : 'MEMBER';

    let membership;
    try {
      membership = this.membershipsService.createIfNotExists({ userId, groupId, role });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    return membership || {};
  }

  @Delete('joined/groups/:groupId')
  async leaveGroup(@Request() request: any, @Param('groupId') groupId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let group;
    try {
      group = await this.groupsService.findOne({ where: { id: groupId } });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }

    let membership;
    try {
      membership = await this.membershipsService.removeIfExists({ userId, groupId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    return membership || {};
  }

  @Get('liked/notes')
  async findLikedNotes(
    @Request() request: any,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take: number,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let likes;
    try {
      const [data, total] = await this.likesService.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        skip: skip > 0 ? skip : undefined,
        take: take > 0 ? take : undefined,
      });
      likes = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return likes;
  }

  @Get('liked/notes/:noteId')
  async findLikedNote(@Request() request: any, @Param('noteId') noteId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findOne({ where: { id: noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    let liked;
    let count: number;
    try {
      liked = await this.likesService.findFirst({ where: { userId, noteId } });
      count = await this.likesService.count({ where: { noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return { liked, count };
  }

  @Put('liked/notes/:noteId')
  async likeNote(@Request() request: any, @Param('noteId') noteId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findOne({ where: { id: noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    try {
      note = await this.notesService._exFindNoteUnderPermission({ userId, noteId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new ForbiddenException();
    }

    let like;
    try {
      like = await this.likesService.createIfNotExists({ userId, noteId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return like || {};
  }

  @Delete('liked/notes/:noteId')
  async unlikeNote(@Request() request: any, @Param('noteId') noteId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findOne({ where: { id: noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    let like;
    try {
      like = await this.likesService.removeIfExist({ userId, noteId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return like || {};
  }

  @Get('stocked/notes')
  async findStockedNotes(
    @Request() request: any,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take: number,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let stocks;
    try {
      const [data, total] = await this.stocksService.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        include: { Label: true },
        skip: skip > 0 ? skip : undefined,
        take: take > 0 ? take : undefined,
      });
      stocks = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return stocks;
  }

  @Get('stocked/notes/:noteId')
  async findStockedNote(@Request() request: any, @Param('noteId') noteId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findOne({ where: { id: noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    let stocked;
    let count: number;
    try {
      const [data] = await this.stocksService.findMany({
        where: { noteId, userId },
        include: { Label: true },
      });
      const data2 = await this.stocksService.findManyDistinct({
        where: { noteId },
        distinct: ['userId'],
      });
      stocked = data;
      count = data2.length;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return { stocked, count };
  }

  @Put('stocked/notes/:noteId/labels/:labelId')
  async stockNoteWithLabel(
    @Request() request: any,
    @Param('noteId') noteId: string,
    @Param('labelId') labelId: string,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findOne({ where: { id: noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    try {
      note = await this.notesService._exFindNoteUnderPermission({ userId, noteId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new ForbiddenException();
    }

    let label;
    try {
      label = await this.stockLabelsService.findFirst({ where: { id: labelId, userId: userId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!label) {
      throw new NotFoundException();
    }

    let stock;
    try {
      stock = await this.stocksService.createIfNotExists({ userId, noteId, labelId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return stock || {};
  }

  @Delete('stocked/notes/:noteId/labels/:labelId')
  async unstockNoteWithLabel(
    @Request() request: any,
    @Param('noteId') noteId: string,
    @Param('labelId') labelId: string,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let note;
    try {
      note = await this.notesService.findOne({ where: { id: noteId } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!note) {
      throw new NotFoundException();
    }

    let stock;
    try {
      stock = await this.stocksService.deleteIfNotExists({ userId, noteId, labelId });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return stock || {};
  }

  @Get('stocked/labels')
  async findStockedLabels(
    @Request() request: any,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take: number,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    let labels;
    try {
      const [data, total] = await this.stockLabelsService.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
        skip: skip > 0 ? skip : undefined,
        take: take > 0 ? take : undefined,
      });
      labels = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return labels;
  }

  @Post('stocked/labels')
  async createStockedLabel(@Request() request: any, @Body('name') name: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (!name) {
      throw new UnprocessableEntityException();
    }

    let label;
    try {
      label = await this.stockLabelsService.create({
        data: { name, User: { connect: { id: userId } } },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException();
        }
        this.logger.error(JSON.stringify(e));
      } else {
        this.logger.error(e);
      }
      throw new InternalServerErrorException();
    }
    return label;
  }

  @Get('photo')
  async getPhoto(@Request() request: any, @Response() response: any) {
    const id = request.user.id;
    if (!id) {
      throw new UnauthorizedException();
    }

    try {
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob('user', `${id}/photo`);
      response.setHeader('Content-Type', downloadBlockBlobResponse.contentType);
      downloadBlockBlobResponse.readableStreamBody?.pipe(response);
    } catch (e) {
      if (e instanceof RestError) {
        if (e.statusCode === 404) {
          const png = jdenticon.toPng(request.user.id, 256, {
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

  @Post('photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Request() request: any,
    @Response() response: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
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
      const result = await this.blobsService.uploadBlob(
        'user',
        `${userId}/photo`,
        file.mimetype,
        file.buffer,
      );
      response.status(201).send({ ...result });
    } catch (e) {
      if (e instanceof RestError) {
        if (e.statusCode) {
          response.status(e.statusCode).send();
        }
        throw new InternalServerErrorException();
      }
    }
  }

  @Get('token')
  async getToken(@Request() request: any, @Response({ passthrough: true }) response: any) {
    const token = await Iron.seal(request.user, this.IRON_SECRET, Iron.defaults);
    response.cookie('filesToken', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/files/',
    });
    return {};
  }
}
