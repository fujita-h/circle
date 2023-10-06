import { Test, TestingModule } from '@nestjs/testing';
import { AzblobService } from './azblob.service';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';

describe('BlobsService', () => {
  let service: AzblobService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AzblobService, ConfigService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV}.local`, '.env.local'],
        }),
      ],
    }).compile();

    service = module.get<AzblobService>(AzblobService);
  });

  beforeEach(async () => {
    //
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
