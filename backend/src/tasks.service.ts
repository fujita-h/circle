import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { RedisService } from './redis.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly redisService: RedisService) {
    this.logger.log('Initializing Tasks Service...');
  }

  @Cron('5 */30 * * * *')
  handleNotesTrendingWeekly() {
    this.logger.log('Updating notes/trending/weekly...');
    const keysArr = [];
    const weightsArr = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - i);
      const formattedDate = date.toISOString().split('T')[0];

      keysArr.push([
        `notes/like/${formattedDate}`,
        `notes/stock/${formattedDate}`,
        `notes/view/${formattedDate}`,
      ]);

      weightsArr.push([
        Math.round(120 + 20 * 1.21 ** (7 - (i + 1))),
        Math.round(100 + 20 * 1.21 ** (7 - (i + 1))),
        Math.round(70 + 30 * 1.21 ** (7 - (i + 1))),
      ]);
    }

    // check for weight table
    //console.table(weightsArr);

    const keys = keysArr.flat();
    const weights = weightsArr.flat();

    this.redisService.zunionstore(
      'notes/trending/weekly',
      keys.length,
      ...keys,
      'WEIGHTS',
      ...weights,
    );
    this.logger.log('Updated notes/trending/weekly');
  }

  @Cron('10 0 */2 * *')
  handleNotesTrendingMonthly() {
    this.logger.log('Updating notes/trending/monthly...');
    const keysArr = [];
    const weightsArr = [];
    for (let i = 0; i < 28; i++) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - i);
      const formattedDate = date.toISOString().split('T')[0];

      keysArr.push([
        `notes/like/${formattedDate}`,
        `notes/stock/${formattedDate}`,
        `notes/view/${formattedDate}`,
      ]);

      weightsArr.push([
        Math.round(120 + 20 * 1.07 ** (30 - (i + 1))),
        Math.round(100 + 20 * 1.06 ** (30 - (i + 1))),
        Math.round(80 + 20 * 1.05 ** (30 - (i + 1))),
      ]);
    }

    // check for weight table
    //console.table(weightsArr);

    const keys = keysArr.flat();
    const weights = weightsArr.flat();

    this.redisService.zunionstore(
      'notes/trending/monthly',
      keys.length,
      ...keys,
      'WEIGHTS',
      ...weights,
    );
    this.logger.log('Updated notes/trending/monthly');
  }
}
