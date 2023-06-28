import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { ConfigService } from '@nestjs/config';
import { AzblobService } from '../azblob/azblob.service';

describe('CommentsService', () => {
  let service: CommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService, CommentsService, AzblobService],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
