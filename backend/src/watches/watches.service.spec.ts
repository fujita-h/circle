import { Test, TestingModule } from '@nestjs/testing';
import { WatchesService } from './watches.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('WatchesService', () => {
  let service: WatchesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WatchesService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    service = module.get<WatchesService>(WatchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
