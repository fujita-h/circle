import { Module } from '@nestjs/common';
import { CirclesService } from './circles.service';
import { CirclesController } from './circles.controller';
import { NotesService } from '../notes/notes.service';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';

@Module({
  controllers: [CirclesController],
  providers: [CirclesService, NotesService, AzblobService, EsService],
})
export class CirclesModule {}
