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
  Patch,
  ParseIntPipe,
  NotAcceptableException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFile,
  UnauthorizedException,
} from '@nestjs/common';
import { CirclesService } from './circles.service';
import { MembershipsService } from '../memberships/memberships.service';
import { NotesService } from '../notes/notes.service';
import { AzblobService } from '../azblob/azblob.service';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { RestError } from '@azure/storage-blob';
import * as jdenticon from 'jdenticon';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('circles')
export class CirclesController {
  private logger = new Logger(CirclesController.name);
  private blobContainerName = 'circle';

  constructor(
    private readonly circlesService: CirclesService,
    private readonly membershipsService: MembershipsService,
    private readonly notesService: NotesService,
    private readonly blobsService: AzblobService,
  ) {
    this.logger.log('Initializing Circles Controller...');
    this.blobsService.init(this.blobContainerName);
  }

  checkHandle(handle: string) {
    if (!handle || !handle.match(/^[a-zA-Z][0-9a-zA-Z\-]{2,}$/i)) {
      throw new Error('Invalid handle');
    }
  }

  @Post()
  async create(@Request() request: any, @Body() data: CreateCircleDto) {
    const userId: string = request?.user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }
    try {
      this.checkHandle(data.handle);
    } catch (e) {
      throw new NotAcceptableException();
    }
    try {
      return await this.circlesService.create({
        data: {
          ...data,
          members: { create: { user: { connect: { id: userId } }, role: 'ADMIN' } },
        },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  @Get()
  async findMany(
    @Query('take', ParseIntPipe) take?: number,
    @Query('skip', ParseIntPipe) skip?: number,
  ) {
    let circles;
    try {
      circles = await this.circlesService.findMany({
        where: { handle: { not: null } },
        take,
        skip,
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return circles;
  }

  @Get('count')
  async count() {
    let count;
    try {
      count = await this.circlesService.count({ where: { handle: { not: null } } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return count;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    let circle;
    try {
      circle = await this.circlesService.findFirst({
        where: { id, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!circle) {
      throw new NotFoundException();
    }
    return circle;
  }

  @Get(':id/photo')
  async getPhoto(@Param('id') id: string, @Response() response: any) {
    let circle;
    try {
      circle = await this.circlesService.findOne({ where: { id } });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!circle) {
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
          const png = jdenticon.toPng(circle.id, 256, {
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

    let circle;
    try {
      circle = await this.circlesService.findOne({
        where: { id },
        include: { members: true },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!circle || !circle.handle || circle.status !== 'NORMAL') {
      throw new NotAcceptableException('Invalid circle');
    }
    if (!circle.members) {
      throw new InternalServerErrorException();
    }
    if (!circle.members.find((m) => m.userId === userId && m.role === 'ADMIN')) {
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
      throw new NotAcceptableException('File too large');
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
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    // get circle
    let circle;
    try {
      circle = await this.circlesService.findFirst({
        where: { id, handle: { not: null }, status: 'NORMAL' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!circle) {
      throw new NotFoundException();
    }

    // get memberships
    let memberships;
    try {
      memberships = await this.membershipsService.findMany({
        where: {
          circleId: circle.id,
        },
        take,
        skip,
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
        include: { user: true },
      });
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
      notes = await this.notesService.findMany({
        where: {
          blobPointer: { not: null }, // only notes with blobPointer
          user: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
          circleId: id,
          OR: [
            { userId: userId }, // user is owner
            {
              status: 'NORMAL',
              circle: {
                handle: { not: null },
                status: 'NORMAL',
                readNotePermission: 'ADMIN',
                members: { some: { userId: userId, role: 'ADMIN' } },
              },
            }, // readNotePermission is ADMIN and user is admin of circle
            {
              status: 'NORMAL',
              circle: {
                handle: { not: null },
                status: 'NORMAL',
                readNotePermission: 'MEMBER',
                members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
              },
            }, // readNotePermission is MEMBER and user is member of circle
            {
              status: 'NORMAL',
              circle: { handle: { not: null }, status: 'NORMAL', readNotePermission: 'ALL' },
            }, // readNotePermission is ALL
          ],
        },
        include: { user: true, circle: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return notes;
  }

  @Get(':id/notes/count')
  async countNotes(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.id;
    let count;
    try {
      count = await this.notesService.count({
        where: {
          blobPointer: { not: null }, // only notes with blobPointer
          user: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
          circleId: id,
          OR: [
            { userId: userId }, // user is owner
            {
              status: 'NORMAL',
              circle: {
                handle: { not: null },
                status: 'NORMAL',
                readNotePermission: 'ADMIN',
                members: { some: { userId: userId, role: 'ADMIN' } },
              },
            }, // readNotePermission is ADMIN and user is admin of circle
            {
              status: 'NORMAL',
              circle: {
                handle: { not: null },
                status: 'NORMAL',
                readNotePermission: 'MEMBER',
                members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
              },
            }, // readNotePermission is MEMBER and user is member of circle
            {
              status: 'NORMAL',
              circle: { handle: { not: null }, status: 'NORMAL', readNotePermission: 'ALL' },
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
    let circle;
    try {
      circle = await this.circlesService.findOne({ where: { handle } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!circle || circle.status === 'DELETED') {
      throw new NotFoundException();
    }
    return circle;
  }

  @Get('handle/:handle/photo')
  async getPhotoByHandle(@Param('handle') handle: string, @Response() response: any) {
    const circle = await this.circlesService.findOne({ where: { handle } });
    if (!circle || !circle.id) {
      throw new NotFoundException();
    }
    return this.getPhoto(circle.id, response);
  }

  @Get('handle/:handle/members')
  async findMembersByHandle(
    @Param('handle') handle: string,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    let circle;
    try {
      circle = await this.circlesService.findOne({ where: { handle } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!circle || circle.status === 'DELETED') {
      throw new NotFoundException();
    }

    return this.findMembers(circle.id, skip, take);
  }

  @Get('handle/:handle/notes')
  async findNotesByHandle(
    @Request() request: any,
    @Param('handle') handle: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    let circle;
    try {
      circle = await this.circlesService.findOne({ where: { handle } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!circle || circle.status === 'DELETED') {
      throw new NotFoundException();
    }

    return this.findNotes(request, circle.id, skip, take);
  }

  @Get('handle/:handle/notes/count')
  async countNotesByHandle(@Request() request: any, @Param('handle') handle: string) {
    let circle;
    try {
      circle = await this.circlesService.findOne({ where: { handle } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!circle || circle.status === 'DELETED') {
      throw new NotFoundException();
    }

    return this.countNotes(request, circle.id);
  }

  @Patch(':id')
  async update(@Request() request: any, @Param('id') id: string, @Body() data: UpdateCircleDto) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    // check permissions
    let circle;
    try {
      circle = await this.circlesService.findOne({ where: { id }, include: { members: true } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }

    if (!circle || circle.status === 'DELETED') {
      throw new NotFoundException();
    }
    if (!circle.members) {
      throw new InternalServerErrorException();
    }

    const member = circle.members.find((m) => m.userId === userId);
    if (!member || member.role !== 'ADMIN') {
      throw new ForbiddenException();
    }

    if (data.handle) {
      try {
        this.checkHandle(data.handle);
      } catch (e) {
        throw new NotAcceptableException();
      }
    }

    let updatedCircle;
    try {
      updatedCircle = await this.circlesService.update({
        where: { id: circle.id },
        data: { ...data },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!updatedCircle) {
      throw new NotFoundException();
    }

    return updatedCircle;
  }

  @Delete(':id')
  async remove(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let circle;
    try {
      circle = await this.circlesService.findFirst({
        where: { id, handle: { not: null }, status: 'NORMAL' },
        include: { members: true },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!circle) {
      throw new NotFoundException();
    }

    if (!circle.members?.some((m) => m.userId === userId && m.role === 'ADMIN')) {
      throw new ForbiddenException();
    }

    try {
      // soft delete
      circle = await this.circlesService.update({
        where: { id },
        data: { handle: null, status: 'DELETED' },
      });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!circle) {
      throw new NotFoundException();
    }

    return circle;
  }
}
