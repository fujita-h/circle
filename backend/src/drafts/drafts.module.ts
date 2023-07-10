import { Module } from '@nestjs/common';
import { DraftsController } from './drafts.controller';
import { NotesService } from '../notes/notes.service';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';
import { CirclesService } from '../circles/circles.service';
@Module({
  controllers: [DraftsController],
  providers: [NotesService, CirclesService, AzblobService, EsService],
})
export class DraftsModule {}
