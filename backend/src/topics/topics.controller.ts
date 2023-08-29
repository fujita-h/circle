import { RestError } from '@azure/storage-blob';
import {
  Body,
  ConflictException,
  Controller,
  DefaultValuePipe,
  Get,
  InternalServerErrorException,
  Logger,
  NotAcceptableException,
  NotFoundException,
  ParseIntPipe,
  PayloadTooLargeException,
  Post,
  Put,
  Query,
  Response,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Prisma } from '@prisma/client';
import * as jdenticon from 'jdenticon';
import { AzblobService } from '../azblob/azblob.service';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { AuthorizedRolesAny } from '../guards/jwt.roles.decorator';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { TopicMapsService } from '../topic-maps/topic-maps.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicsService } from './topics.service';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('topics')
export class TopicsController {
  private logger = new Logger(TopicsController.name);
  private blobContainerName = 'topic';

  constructor(
    private readonly topicsService: TopicsService,
    private readonly topicMapsService: TopicMapsService,
    private readonly blobsService: AzblobService,
  ) {
    this.logger.log('Initializing Topics Controller...');
    this.blobsService.init(this.blobContainerName);
  }

  @AuthorizedRolesAny('Topic.Write')
  @Post()
  async createTopic(@Body() data: CreateTopicDto) {
    try {
      return this.topicsService.create({ data });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException();
        }
        this.logger.error(JSON.stringify(e));
      } else {
        this.logger.error(e);
      }
      throw new InternalServerErrorException();
    }
  }

  @Get()
  async findMany(
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
  ) {
    let topics;
    try {
      const [data, total] = await this.topicsService.findMany({
        take: take && take > 0 ? take : undefined,
        skip: skip && skip > 0 ? skip : undefined,
      });
      topics = { data, meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return topics;
  }

  @Get(':id')
  async findOne(@Query('id') id: string) {
    let topic;
    try {
      topic = await this.topicsService.findOne({ where: { id } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!topic) {
      throw new NotFoundException();
    }
    return topic;
  }

  @AuthorizedRolesAny('Topic.Write')
  @Put(':id')
  async updateTopic(@Query('id') id: string, @Body() data: UpdateTopicDto) {
    try {
      return await this.topicsService.update({ where: { id }, data });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException();
        }
        this.logger.error(JSON.stringify(e));
      } else {
        this.logger.error(e);
      }
      throw new InternalServerErrorException();
    }
  }

  @Get(':id/notes')
  async findNotes(
    @Query('id') id: string,
    @Query('take', new DefaultValuePipe(-1), ParseIntPipe) take?: number,
    @Query('skip', new DefaultValuePipe(-1), ParseIntPipe) skip?: number,
  ) {
    let topic;
    try {
      topic = await this.topicsService.findOne({
        where: { id },
        include: { Notes: false, _count: false },
      });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!topic) {
      throw new NotFoundException();
    }
    let notes;
    try {
      const [data, total] = await this.topicMapsService.findMany({
        where: { topicId: id },
        orderBy: { Note: { publishedAt: 'desc' } },
        include: {
          Note: { include: { User: true, Group: true, _count: { select: { Liked: true } } } },
        },
        take: take && take > 0 ? take : undefined,
        skip: skip && skip > 0 ? skip : undefined,
      });
      notes = { data: data.map((x) => x.Note), meta: { total } };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    return notes;
  }

  @Get(':id/photo')
  async getPhoto(@Query('id') id: string, @Response() response: any) {
    let topic;
    try {
      topic = await this.topicsService.findOne({ where: { id } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!topic) {
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
          const png = jdenticon.toPng(topic.id, 256, {
            padding: 0.08,
            lightness: {
              color: [0.75, 1.0],
              grayscale: [0.75, 1.0],
            },
            saturation: {
              color: 0.0,
              grayscale: 0.0,
            },
            backColor: '#5e2affe3',
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

  @AuthorizedRolesAny('Topic.Write')
  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(@Query('id') id: string, @UploadedFile() file: Express.Multer.File) {
    let topic;
    try {
      topic = await this.topicsService.findOne({ where: { id } });
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException();
    }
    if (!topic) {
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
      throw new PayloadTooLargeException('File too large');
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
}
