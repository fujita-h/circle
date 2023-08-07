import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { RedisService } from './redis.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly redisService: RedisService) {
    this.logger.log('Initializing Tasks Service...');
  }

  @Cron('30 */30 * * * *')
  handleWeeklyTrending() {
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
  }

  @Cron('3 3 */3 * *')
  handleMonthlyTrending() {
    const keysArr = [];
    const weightsArr = [];
    for (let i = 0; i < 30; i++) {
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
  }
}
