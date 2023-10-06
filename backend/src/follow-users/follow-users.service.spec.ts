import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { FollowUsersService } from './follow-users.service';

describe('FollowUsersService', () => {
  let service: FollowUsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FollowUsersService, PrismaService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV}.local`, '.env.local'],
        }),
      ],
    }).compile();

    service = module.get<FollowUsersService>(FollowUsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
