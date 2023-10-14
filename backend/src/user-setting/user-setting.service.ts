import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { init } from '@paralleldrive/cuid2';

const cuid = init({ length: 24 });

@Injectable()
export class UserSettingService {
  private logger = new Logger(UserSettingService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('Initializing User Setting Service...');
  }

  create({
    data,
    include = { User: false },
  }: {
    data: Prisma.UserSettingCreateInput;
    include?: Prisma.UserSettingInclude;
  }) {
    return this.prisma.userSetting.create({ data: { id: cuid(), ...data }, include });
  }

  findOne({
    where,
    include = { User: false },
  }: {
    where: Prisma.UserSettingWhereUniqueInput;
    include?: Prisma.UserSettingInclude;
  }) {
    return this.prisma.userSetting.findUnique({ where, include });
  }

  update({
    where,
    data,
    include = { User: false },
  }: {
    where: Prisma.UserSettingWhereUniqueInput;
    data: Prisma.UserSettingUpdateInput;
    include?: Prisma.UserSettingInclude;
  }) {
    return this.prisma.userSetting.update({ where, data, include });
  }

  delete({
    where,
    include = { User: false },
  }: {
    where: Prisma.UserSettingWhereUniqueInput;
    include?: Prisma.UserSettingInclude;
  }) {
    return this.prisma.userSetting.delete({ where, include });
  }
}
