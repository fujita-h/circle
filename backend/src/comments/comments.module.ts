import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { AzblobService } from '../azblob/azblob.service';
import { ConfigService } from '@nestjs/config';
import { ItemsService } from '../items/items.service';
import { EsService } from '../es/es.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, ConfigService, ItemsService, EsService, AzblobService],
})
export class CommentsModule {}
