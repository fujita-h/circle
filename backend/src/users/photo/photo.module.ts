import { Module } from '@nestjs/common';
import { PhotoController } from './photo.controller';
import { AzblobService } from 'src/azblob/azblob.service';

@Module({
  controllers: [PhotoController],
  providers: [AzblobService],
})
export class PhotoModule {}
