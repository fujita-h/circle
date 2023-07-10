import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EsService } from '../es/es.service';
import { AzblobService } from '../azblob/azblob.service';
import { NotesService } from '../notes/notes.service';
import { MembershipsService } from '../memberships/memberships.service';
@Module({
  controllers: [UsersController],
  providers: [UsersService, MembershipsService, NotesService, EsService, AzblobService],
})
export class UsersModule {}
