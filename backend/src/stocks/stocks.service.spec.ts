import { Test, TestingModule } from '@nestjs/testing';
import { StocksService } from './stocks.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('StocksService', () => {
  let service: StocksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StocksService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    service = module.get<StocksService>(StocksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
