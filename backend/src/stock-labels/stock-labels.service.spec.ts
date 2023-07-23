import { Test, TestingModule } from '@nestjs/testing';
import { StockLabelsService } from './stock-labels.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';

describe('StockLabelsService', () => {
  let service: StockLabelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockLabelsService, PrismaService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    service = module.get<StockLabelsService>(StockLabelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
