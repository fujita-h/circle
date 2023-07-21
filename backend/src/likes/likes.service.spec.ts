import { Test, TestingModule } from '@nestjs/testing';
import { LikesService } from './likes.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('LikesService', () => {
  let service: LikesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LikesService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
