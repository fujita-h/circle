import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Response,
  UseGuards,
} from '@nestjs/common';
import { AzblobService } from '../../azblob/azblob.service';
import { JwtAuthGuard } from '../../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../../guards/jwt.roles.guard';
import { RestError } from '@azure/storage-blob';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('/users/:id/photo')
export class PhotoController {
  constructor(private readonly blobsService: AzblobService) {
    this.blobsService.init('user');
  }

  @Get()
  async getPhoto(@Param('id') id: string, @Response() response: any) {
    try {
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob('user', `${id}/photo`);
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
}
