import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';
import { CirclesService } from '../circles/circles.service';
import { CommentsService } from '../comments/comments.service';

@Module({
  controllers: [NotesController],
  providers: [NotesService, CirclesService, CommentsService, AzblobService, EsService],
})
export class NotesModule {}
