import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis {
  constructor(private readonly configService: ConfigService) {
    super(configService.get<string>('REDIS_ENDPOINT') || 'redis://127.0.0.1:6379');
  }
}
