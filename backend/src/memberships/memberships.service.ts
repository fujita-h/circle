import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { Prisma, MembershipRole } from '@prisma/client';

@Injectable()
export class MembershipsService {
  private logger = new Logger(MembershipsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('Initializing Memberships Service...');
  }

  findOne({
    where,
    include = { User: false, Group: false },
  }: {
    where: Prisma.MembershipWhereUniqueInput;
    include?: Prisma.MembershipInclude;
  }) {
    return this.prisma.membership.findUnique({ where, include });
  }

  findFirst({
    where,
    orderBy,
    include = { User: false, Group: false },
  }: {
    where: Prisma.MembershipWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.MembershipOrderByWithRelationInput>;
    include?: Prisma.MembershipInclude;
  }) {
    return this.prisma.membership.findFirst({ where, orderBy, include });
  }

  findMany({
    where,
    orderBy,
    include = { User: false, Group: false },
    skip,
    take,
  }: {
    where: Prisma.MembershipWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.MembershipOrderByWithRelationInput>;
    include?: Prisma.MembershipInclude;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.$transaction([
      this.prisma.membership.findMany({ where, orderBy, include, skip, take }),
      this.prisma.membership.count({ where }),
    ]);
  }

  count({ where }: { where: Prisma.MembershipWhereInput }) {
    return this.prisma.membership.count({ where });
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
    return this.prisma.$transaction(async (prisma) => {
      let membership;
      membership = await prisma.membership.findUnique({
        where: { userId_groupId: { userId, groupId } },
      });
      if (!membership) {
        membership = await prisma.membership.create({
          data: { userId, groupId, role },
        });
      }
      return membership;
    });
  }

  removeIfExists({ userId, groupId }: { userId: string; groupId: string }) {
    return this.prisma.$transaction(async (prisma) => {
      let membership;
      membership = await prisma.membership.findUnique({
        where: { userId_groupId: { userId, groupId } },
      });
      if (membership) {
        membership = await prisma.membership.delete({
          where: { userId_groupId: { userId, groupId } },
        });
      }
      return membership;
    });
  }
}
