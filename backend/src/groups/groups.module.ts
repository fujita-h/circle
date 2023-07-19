import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { MembershipsService } from '../memberships/memberships.service';
import { NotesService } from '../notes/notes.service';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, MembershipsService, NotesService, AzblobService, EsService],
})
export class GroupsModule {}
