import { Test, TestingModule } from '@nestjs/testing';
import { TagsService } from './tags.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('TagsService', () => {
  let service: TagsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagsService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
