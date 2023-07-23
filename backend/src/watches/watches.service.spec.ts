import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { WatchesService } from './watches.service';

describe('WatchesService', () => {
  let service: WatchesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WatchesService, PrismaService],
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
