import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { AzblobService } from 'src/azblob/azblob.service';

@Module({
  controllers: [FilesController],
  providers: [AzblobService],
})
export class FilesModule {}
