import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DraftsController } from './drafts.controller';
import { ItemsService } from '../items/items.service';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';
import { GroupsService } from '../groups/groups.service';

describe('DraftsController', () => {
  let controller: DraftsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DraftsController],
      providers: [ItemsService, GroupsService, AzblobService, EsService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    controller = module.get<DraftsController>(DraftsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
