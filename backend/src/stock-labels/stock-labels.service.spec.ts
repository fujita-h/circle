import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { StockLabelsService } from './stock-labels.service';

describe('StockLabelsService', () => {
  let service: StockLabelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockLabelsService, PrismaService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV}.local`, '.env.local'],
        }),
      ],
    }).compile();

    service = module.get<StockLabelsService>(StockLabelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
