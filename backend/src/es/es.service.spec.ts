import { Test, TestingModule } from '@nestjs/testing';
import { EsService } from './es.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('EsService', () => {
  let service: EsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EsService, ConfigService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    service = module.get<EsService>(EsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
