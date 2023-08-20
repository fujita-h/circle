import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FollowUsersService {
  private logger = new Logger(FollowUsersService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('Initializing FollowUsers Service...');
  }

  create({
    data,
    include = { From: false, To: false },
  }: {
    data: Prisma.FollowUserCreateInput;
    include?: Prisma.FollowUserInclude;
  }) {
    return this.prisma.followUser.create({ data, include });
  }

  findAll({ include = { From: false, To: false } }: { include?: Prisma.FollowUserInclude }) {
    return this.prisma.followUser.findMany({ include });
  }

  findMany({
    where,
    orderBy,
    include = { From: false, To: false },
    take,
    skip,
  }: {
    where?: Prisma.FollowUserWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.FollowUserOrderByWithRelationInput>;
    include?: Prisma.FollowUserInclude;
    take?: number;
    skip?: number;
  }) {
    return this.prisma.$transaction([
      this.prisma.followUser.findMany({ where, orderBy, include, take, skip }),
      this.prisma.followUser.count({ where }),
    ]);
  }

  count({ where }: { where?: Prisma.FollowUserWhereInput }) {
    return this.prisma.followUser.count({ where });
  }

  findFirst({
    where,
    orderBy,
    include = { From: false, To: false },
  }: {
    where?: Prisma.FollowUserWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.FollowUserOrderByWithRelationInput>;
    include?: Prisma.FollowUserInclude;
  }) {
    return this.prisma.followUser.findFirst({ where, orderBy, include });
  }

  findUnique({
    where,
    include = { From: false, To: false },
  }: {
    where: Prisma.FollowUserWhereUniqueInput;
    include?: Prisma.FollowUserInclude;
  }) {
    return this.prisma.followUser.findUnique({ where, include });
  }

  update({
    where,
    data,
    include = { From: false, To: false },
  }: {
    where: Prisma.FollowUserWhereUniqueInput;
    data: Prisma.FollowUserUpdateInput;
    include?: Prisma.FollowUserInclude;
  }) {
    return this.prisma.followUser.update({ where, data, include });
  }

  delete({
    where,
    include = { From: false, To: false },
  }: {
    where: Prisma.FollowUserWhereUniqueInput;
    include?: Prisma.FollowUserInclude;
  }) {
    return this.prisma.followUser.delete({ where, include });
  }

  createIfNotExists({ fromId, toId }: { fromId: string; toId: string }) {
    return this.prisma.$transaction(async (prisma) => {
      let followUser;
      followUser = await prisma.followUser.findUnique({
        where: { fromId_toId: { fromId, toId } },
      });
      if (!followUser) {
        followUser = await prisma.followUser.create({
          data: { fromId, toId },
        });
      }
      return followUser;
    });
  }

  removeIfExists({ fromId, toId }: { fromId: string; toId: string }) {
    return this.prisma.$transaction(async (prisma) => {
      let followUser;
      followUser = await prisma.followUser.findUnique({
        where: { fromId_toId: { fromId, toId } },
      });
      if (followUser) {
        followUser = await prisma.followUser.delete({
          where: { fromId_toId: { fromId, toId } },
        });
      }
      return followUser;
    });
  }
}
