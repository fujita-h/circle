import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma.service';

import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';

import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';
import { TopicMapsService } from '../topic-maps/topic-maps.service';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis.service';

describe('TopicsController', () => {
  let controller: TopicsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TopicsController],
      providers: [
        AzblobService,
        PrismaService,
        TopicsService,
        TopicMapsService,
        UsersService,
        EsService,
        RedisService,
      ],
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV}.local`, '.env.local'],
        }),
      ],
    }).compile();

    controller = module.get<TopicsController>(TopicsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
