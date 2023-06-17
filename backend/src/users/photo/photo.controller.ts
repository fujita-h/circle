import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Response,
  UseGuards,
} from '@nestjs/common';
import { AzblobService } from '../../azblob/azblob.service';
import { JwtAuthGuard } from '../../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../../guards/jwt.roles.guard';

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
