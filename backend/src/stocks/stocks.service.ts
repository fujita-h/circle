import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class StocksService {
  private logger = new Logger(StocksService.name);

  constructor(private configService: ConfigService) {
    this.logger.log('Initializing Stocks Service...');
  }
}
