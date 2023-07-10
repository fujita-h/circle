import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class MembershipsService {
  private logger = new Logger(MembershipsService.name);

  constructor(private configService: ConfigService) {
    this.logger.log('Initializing Memberships Service...');
  }

  findOne({
    where,
    include = { user: false, circle: false },
  }: {
    where: Prisma.MembershipWhereUniqueInput;
    include?: Prisma.MembershipInclude;
  }) {
    return prisma.membership.findUnique({ where, include });
  }

  findFirst({
    where,
    orderBy,
    include = { user: false, circle: false },
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
    include = { user: false, circle: false },
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

  createIfNotExists({ userId, circleId }: { userId: string; circleId: string }) {
    return prisma.membership.upsert({
      where: { userId_circleId: { userId, circleId } },
      create: { userId, circleId, role: 'MEMBER' },
      update: {},
    });
  }

  removeIfExists({ userId, circleId }: { userId: string; circleId: string }) {
    return prisma.$transaction(async (prisma) => {
      const check = await prisma.membership.findUnique({
        where: { userId_circleId: { userId, circleId } },
      });
      if (!check) return null;
      return prisma.membership.delete({ where: { userId_circleId: { userId, circleId } } });
    });
  }
}
