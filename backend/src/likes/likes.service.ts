import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class LikesService {
  private logger = new Logger(LikesService.name);

  constructor(private configService: ConfigService) {
    this.logger.log('Initializing Likes Service...');
  }
}
