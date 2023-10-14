import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { UserSettingService } from './user-setting.service';

describe('UserSettingService', () => {
  let service: UserSettingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserSettingService, PrismaService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV}.local`, '.env.local'],
        }),
      ],
    }).compile();

    service = module.get<UserSettingService>(UserSettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
