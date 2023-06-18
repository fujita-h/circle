import {
  Controller,
  Logger,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Request,
  Response,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { init } from '@paralleldrive/cuid2';
import { FileInterceptor } from '@nestjs/platform-express';
import { AzblobService } from '../azblob/azblob.service';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { RestError } from '@azure/storage-blob';
import * as Iron from '@hapi/iron';
import { ConfigService } from '@nestjs/config';

const cuid = init({ length: 24 });

@Controller('files')
export class FilesController {
  private logger = new Logger(FilesController.name);
  private IRON_SECRET: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly blobsService: AzblobService,
  ) {
    this.blobsService.init('file');
    if (!this.configService.get<string>('IRON_SECRET')) {
      this.logger.error('IRON_SECRET is not defined');
      throw new Error('IRON_SECRET is not defined');
    }
    this.IRON_SECRET = this.configService.get<string>('IRON_SECRET') || '';
  }

  @Get('/:id')
  async getFile(@Request() request: any, @Param('id') id: string, @Response() response: any) {
    // check cookie token
    const sealed = request.cookies['filesToken'];
    if (!sealed) {
      throw new UnauthorizedException();
    }
    const token = await Iron.unseal(sealed, this.IRON_SECRET, Iron.defaults);
    if (!token) {
      throw new UnauthorizedException();
    }
    if (!token?.id || token.oid !== token?.token?.oid || !token?.token?.aud) {
      throw new UnauthorizedException();
    }

    try {
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob('file', `${id}`);
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

  @UseGuards(JwtAuthGuard, JwtRolesGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Request() request: any,
    @Response() response: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = request.user.id;
    const blobCuid = cuid();
    try {
      const result = await this.blobsService.uploadBlob(
        'file',
        `${blobCuid}`,
        file.mimetype,
        file.buffer,
        { userId: userId },
      );
      response.status(201).send({ id: blobCuid, ...result });
    } catch (e) {
      if (e instanceof RestError) {
        if (e.statusCode) {
          response.status(e.statusCode).send(e);
        }
      }
      throw new InternalServerErrorException();
    }
  }
}
