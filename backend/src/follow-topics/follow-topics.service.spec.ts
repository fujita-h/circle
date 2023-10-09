import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { FollowTopicsService } from './follow-topics.service';

describe('FollowGroupsService', () => {
  let service: FollowTopicsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FollowTopicsService, PrismaService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV}.local`, '.env.local'],
        }),
      ],
    }).compile();

    service = module.get<FollowTopicsService>(FollowTopicsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
