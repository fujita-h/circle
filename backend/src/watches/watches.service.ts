import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class WatchesService {
  private logger = new Logger(WatchesService.name);

  constructor(private configService: ConfigService) {
    this.logger.log('Initializing Watches Service...');
  }
}
