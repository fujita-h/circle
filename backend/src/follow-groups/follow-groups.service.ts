import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FollowGroupsService {
  private logger = new Logger(FollowGroupsService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('Initializing FollowGroups Service...');
  }

  create({
    data,
    include = { User: false, Group: false },
  }: {
    data: Prisma.FollowGroupCreateInput;
    include?: Prisma.FollowGroupInclude;
  }) {
    return this.prisma.followGroup.create({ data, include });
  }

  findAll({ include = { User: false, Group: false } }: { include?: Prisma.FollowGroupInclude }) {
    return this.prisma.followGroup.findMany({ include });
  }

  findMany({
    where,
    orderBy,
    include = { User: false, Group: false },
    take,
    skip,
  }: {
    where?: Prisma.FollowGroupWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.FollowGroupOrderByWithRelationInput>;
    include?: Prisma.FollowGroupInclude;
    take?: number;
    skip?: number;
  }) {
    return this.prisma.$transaction([
      this.prisma.followGroup.findMany({ where, orderBy, include, take, skip }),
      this.prisma.followGroup.count({ where }),
    ]);
  }

  count({ where }: { where?: Prisma.FollowGroupWhereInput }) {
    return this.prisma.followGroup.count({ where });
  }

  findFirst({
    where,
    orderBy,
    include = { User: false, Group: false },
  }: {
    where?: Prisma.FollowGroupWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.FollowGroupOrderByWithRelationInput>;
    include?: Prisma.FollowGroupInclude;
  }) {
    return this.prisma.followGroup.findFirst({ where, orderBy, include });
  }

  findUnique({
    where,
    include = { User: false, Group: false },
  }: {
    where: Prisma.FollowGroupWhereUniqueInput;
    include?: Prisma.FollowGroupInclude;
  }) {
    return this.prisma.followGroup.findUnique({ where, include });
  }

  update({
    where,
    data,
    include = { User: false, Group: false },
  }: {
    where: Prisma.FollowGroupWhereUniqueInput;
    data: Prisma.FollowGroupUpdateInput;
    include?: Prisma.FollowGroupInclude;
  }) {
    return this.prisma.followGroup.update({ where, data, include });
  }

  delete({
    where,
    include = { User: false, Group: false },
  }: {
    where: Prisma.FollowGroupWhereUniqueInput;
    include?: Prisma.FollowGroupInclude;
  }) {
    return this.prisma.followGroup.delete({ where, include });
  }

  createIfNotExists({ userId, groupId }: { userId: string; groupId: string }) {
    return this.prisma.$transaction(async (prisma) => {
      let followGroup;
      let created = false;
      followGroup = await prisma.followGroup.findUnique({
        where: { userId_groupId: { userId, groupId } },
      });
      if (!followGroup) {
        followGroup = await prisma.followGroup.create({
          data: { userId, groupId },
        });
        created = true;
      }
      return { data: followGroup, created };
    });
  }

  removeIfExists({ userId, groupId }: { userId: string; groupId: string }) {
    return this.prisma.$transaction(async (prisma) => {
      let followGroup;
      let deleted = false;
      followGroup = await prisma.followGroup.findUnique({
        where: { userId_groupId: { userId, groupId } },
      });
      if (followGroup) {
        followGroup = await prisma.followGroup.delete({
          where: { userId_groupId: { userId, groupId } },
        });
        deleted = true;
      }
      return { data: followGroup, deleted };
    });
  }
}
