import { Module } from '@nestjs/common';
import { DraftsController } from './drafts.controller';
import { ItemsService } from '../items/items.service';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';
import { GroupsService } from '../groups/groups.service';
@Module({
  controllers: [DraftsController],
  providers: [ItemsService, GroupsService, AzblobService, EsService],
})
export class DraftsModule {}
