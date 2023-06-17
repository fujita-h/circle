import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';
import { GroupsService } from '../groups/groups.service';

@Module({
  controllers: [ItemsController],
  providers: [ItemsService, GroupsService, AzblobService, EsService],
})
export class ItemsModule {}
