import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DraftsController } from './drafts.controller';
import { NotesService } from '../notes/notes.service';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';
import { CirclesService } from '../circles/circles.service';

describe('DraftsController', () => {
  let controller: DraftsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DraftsController],
      providers: [NotesService, CirclesService, AzblobService, EsService],
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
