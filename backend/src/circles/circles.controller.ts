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
} from '@nestjs/common';
import { CirclesService } from './circles.service';
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
    try {
      this.checkHandle(data.handle);
      const userId = request.user.id;
      return await this.circlesService.create({
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
    return this.circlesService.findMany({ where: { handle: { not: null } }, take, skip });
  }

  @Get('count')
  count() {
    return this.circlesService.count({ where: { handle: { not: null } } });
  }

  @Get('types/open')
  findOpenMany(
    @Query('take', ParseIntPipe) take?: number,
    @Query('skip', ParseIntPipe) skip?: number,
  ) {
    return this.circlesService.findMany({
      where: { type: 'OPEN', handle: { not: null } },
      take,
      skip,
    });
  }

  @Get('types/open/count')
  countOpen() {
    return this.circlesService.count({ where: { type: 'OPEN', handle: { not: null } } });
  }

  @Get('/types/public')
  findPublicMany(
    @Query('take', ParseIntPipe) take?: number,
    @Query('skip', ParseIntPipe) skip?: number,
  ) {
    return this.circlesService.findMany({
      where: { type: 'PUBLIC', handle: { not: null } },
      take,
      skip,
    });
  }

  @Get('/types/public/count')
  countPublic() {
    return this.circlesService.count({ where: { type: 'PUBLIC', handle: { not: null } } });
  }

  @Get('/types/private')
  findPrivateMany(
    @Query('take', ParseIntPipe) take?: number,
    @Query('skip', ParseIntPipe) skip?: number,
  ) {
    return this.circlesService.findMany({
      where: { type: 'PRIVATE', handle: { not: null } },
      take,
      skip,
    });
  }

  @Get('/types/private/count')
  countPrivate() {
    return this.circlesService.count({ where: { type: 'PRIVATE', handle: { not: null } } });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.circlesService.findFirst({ where: { id, handle: { not: null } } });
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
    const circle = await this.circlesService.findOne({ where: { id } });
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
    const circle = await this.circlesService.findFirst({ where: { id } });
    if (!circle || !circle.handle || circle.status === 'DELETED') {
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
      return this.blobsService.uploadBlob(
        this.blobContainerName,
        `${id}/photo`,
        file.mimetype,
        file.buffer,
      );
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  @Get('handle/:handle')
  async FindOneByHandle(@Param('handle') handle: string) {
    const circle = await this.circlesService.findOne({ where: { handle } });
    if (!circle || circle.status === 'DELETED') {
      throw new NotFoundException();
    }
    return circle;
  }

  @Get('handle/:handle/photo')
  async getPhotoByHandle(@Param('handle') handle: string, @Response() response: any) {
    const circle = await this.FindOneByHandle(handle);
    if (!circle || !circle.id) {
      throw new NotFoundException();
    }
    const id = circle.id;
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
        }
      }
      throw new InternalServerErrorException();
    }
  }

  @Get(':id/notes')
  async findNotes(
    @Request() request: any,
    @Param('id') id: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const userId = request.user.id;
    try {
      return await this.notesService.findMany({
        where: {
          status: 'NORMAL',
          circle: {
            id: id, // note belongs to the circle
            handle: { not: null }, // circle has a handle (not deleted)
          },
          user: { handle: { not: null } }, // note belongs to an existing user
          OR: [
            { user: { id: userId } }, // you are owner
            {
              // you are member of the circle
              circle: {
                members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } },
              },
            },
            { circle: { type: { in: ['OPEN', 'PUBLIC'] } } }, // circle is open or public
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

  @Get('handle/:handle/notes')
  async findNotesByHandle(
    @Request() request: any,
    @Param('handle') handle: string,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    if (!handle) {
      throw new NotAcceptableException('Invalid handle');
    }

    const check = await this.circlesService.findFirst({
      where: {
        handle,
        OR: [
          { members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } } }, // you are member of the circle
          { type: { in: ['OPEN', 'PUBLIC'] } }, // circle is open or public
        ],
      },
    });

    if (!check) {
      throw new ForbiddenException('You are not allowed to access this circle notes');
    }

    return this.notesService.findMany({
      where: {
        status: 'NORMAL',
        blobPointer: { not: null },
        circle: { handle: handle },
        user: { handle: { not: null } }, // note belongs to an existing user
        OR: [
          {
            // you are member of the circle
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
        status: 'NORMAL',
        blobPointer: { not: null },
        circle: { handle: handle },
        user: { handle: { not: null } }, // note belongs to an existing user
        OR: [
          {
            // you are member of the circle
            circle: {
              members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } },
            },
          },
          { circle: { type: { in: ['OPEN', 'PUBLIC'] } } }, // circle is open or public
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

    return this.circlesService.findMembers({
      where: {
        circle: {
          handle,
          status: 'NORMAL',
          OR: [
            { members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } } }, // you are member of the circle
            { type: { in: ['OPEN', 'PUBLIC'] } }, // circle is open or public
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

    return this.circlesService.countMembers({
      where: {
        circle: {
          handle,
          status: 'NORMAL',
          OR: [
            { members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } } }, // you are member of the circle
            { type: { in: ['OPEN', 'PUBLIC'] } }, // circle is open or public
          ],
        },
      },
    });
  }

  @Patch(':id')
  async update(@Request() request: any, @Param('id') id: string, @Body() data: UpdateCircleDto) {
    const userId = request.user.id;

    // check permissions
    const circle = await this.circlesService.findOne({ where: { id }, include: { members: true } });
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

    return await this.circlesService.update({ where: { id }, data: { ...data, type: undefined } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      // soft delete
      return await this.circlesService.update({
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
