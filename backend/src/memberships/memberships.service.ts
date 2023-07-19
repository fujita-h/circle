import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma, MembershipRole } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class MembershipsService {
  private logger = new Logger(MembershipsService.name);

  constructor(private configService: ConfigService) {
    this.logger.log('Initializing Memberships Service...');
  }

  findOne({
    where,
    include = { user: false, group: false },
  }: {
    where: Prisma.MembershipWhereUniqueInput;
    include?: Prisma.MembershipInclude;
  }) {
    return prisma.membership.findUnique({ where, include });
  }

  findFirst({
    where,
    orderBy,
    include = { user: false, group: false },
  }: {
    where: Prisma.MembershipWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.MembershipOrderByWithRelationInput>;
    include?: Prisma.MembershipInclude;
  }) {
    return prisma.membership.findFirst({ where, orderBy, include });
  }

  findMany({
    where,
    orderBy,
    include = { user: false, group: false },
    skip,
    take,
  }: {
    where: Prisma.MembershipWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.MembershipOrderByWithRelationInput>;
    include?: Prisma.MembershipInclude;
    skip?: number;
    take?: number;
  }) {
    return prisma.membership.findMany({ where, orderBy, include, skip, take });
  }

  count({ where }: { where: Prisma.MembershipWhereInput }) {
    return prisma.membership.count({ where });
  }

  createIfNotExists({
    userId,
    groupId,
    role,
  }: {
    userId: string;
    groupId: string;
    role: MembershipRole;
  }) {
    return prisma.membership.upsert({
      where: { userId_groupId: { userId, groupId } },
      create: { userId, groupId, role: role },
      update: {},
    });
  }

  removeIfExists({ userId, groupId }: { userId: string; groupId: string }) {
    return prisma.$transaction(async (prisma) => {
      const check = await prisma.membership.findUnique({
        where: { userId_groupId: { userId, groupId } },
      });
      if (!check) return null;
      return prisma.membership.delete({ where: { userId_groupId: { userId, groupId } } });
    });
  }
}
