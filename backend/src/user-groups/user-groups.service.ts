import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class UserGroupsService {
  private logger = new Logger(UserGroupsService.name);

  constructor(private configService: ConfigService) {
    this.logger.log('Initializing UserGroups Service...');
  }

  findOne({
    where,
    include = { user: false, group: false },
  }: {
    where: Prisma.UserGroupWhereUniqueInput;
    include?: Prisma.UserGroupInclude;
  }) {
    return prisma.userGroup.findUnique({ where, include });
  }

  findFirst({
    where,
    orderBy,
    include = { user: false, group: false },
  }: {
    where: Prisma.UserGroupWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.UserGroupOrderByWithRelationInput>;
    include?: Prisma.UserGroupInclude;
  }) {
    return prisma.userGroup.findFirst({ where, orderBy, include });
  }

  findMany({
    where,
    orderBy,
    include = { user: false, group: false },
    skip,
    take,
  }: {
    where: Prisma.UserGroupWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.UserGroupOrderByWithRelationInput>;
    include?: Prisma.UserGroupInclude;
    skip?: number;
    take?: number;
  }) {
    return prisma.userGroup.findMany({ where, orderBy, include, skip, take });
  }

  count({ where }: { where: Prisma.UserGroupWhereInput }) {
    return prisma.userGroup.count({ where });
  }

  createIfNotExists({ userId, groupId }: { userId: string; groupId: string }) {
    return prisma.userGroup.upsert({
      where: { userId_groupId: { userId, groupId } },
      create: { userId, groupId, role: 'MEMBER' },
      update: {},
    });
  }

  removeIfExists({ userId, groupId }: { userId: string; groupId: string }) {
    return prisma.$transaction(async (prisma) => {
      const check = await prisma.userGroup.findUnique({
        where: { userId_groupId: { userId, groupId } },
      });
      if (!check) return null;
      return prisma.userGroup.delete({ where: { userId_groupId: { userId, groupId } } });
    });
  }
}
