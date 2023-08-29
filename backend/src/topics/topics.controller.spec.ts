import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma.service';

import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';

import { TopicMapsService } from '../topic-maps/topic-maps.service';
import { AzblobService } from '../azblob/azblob.service';

describe('TopicsController', () => {
  let controller: TopicsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TopicsController],
      providers: [AzblobService, PrismaService, TopicsService, TopicMapsService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    controller = module.get<TopicsController>(TopicsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
