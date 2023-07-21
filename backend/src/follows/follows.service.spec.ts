import { Test, TestingModule } from '@nestjs/testing';
import { FollowsService } from './follows.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('FollowsService', () => {
  let service: FollowsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FollowsService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    service = module.get<FollowsService>(FollowsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
