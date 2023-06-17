import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { ItemsService } from '../items/items.service';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, ItemsService, AzblobService, EsService],
})
export class GroupsModule {}
