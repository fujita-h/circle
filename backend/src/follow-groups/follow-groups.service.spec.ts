import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { FollowGroupsService } from './follow-groups.service';

describe('FollowGroupsService', () => {
  let service: FollowGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FollowGroupsService, PrismaService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    service = module.get<FollowGroupsService>(FollowGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
