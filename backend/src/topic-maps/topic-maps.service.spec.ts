import { Test, TestingModule } from '@nestjs/testing';
import { TopicMapsService } from './topic-maps.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma.service';

describe('TopicMapsService', () => {
  let service: TopicMapsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TopicMapsService, PrismaService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV}.local`, '.env.local'],
        }),
      ],
    }).compile();

    service = module.get<TopicMapsService>(TopicMapsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
