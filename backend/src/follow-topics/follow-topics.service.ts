import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FollowTopicsService {
  private logger = new Logger(FollowTopicsService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('Initializing FollowTopics Service...');
  }

  create({
    data,
    include = { User: false, Topic: false },
  }: {
    data: Prisma.FollowTopicCreateInput;
    include?: Prisma.FollowTopicInclude;
  }) {
    return this.prisma.followTopic.create({ data, include });
  }

  findMany({
    where,
    orderBy,
    include = { User: false, Topic: false },
    take,
    skip,
  }: {
    where?: Prisma.FollowTopicWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.FollowTopicOrderByWithRelationInput>;
    include?: Prisma.FollowTopicInclude;
    take?: number;
    skip?: number;
  }) {
    return this.prisma.$transaction([
      this.prisma.followTopic.findMany({ where, orderBy, include, take, skip }),
      this.prisma.followTopic.count({ where }),
    ]);
  }

  count({ where }: { where?: Prisma.FollowTopicWhereInput }) {
    return this.prisma.followTopic.count({ where });
  }

  findFirst({
    where,
    orderBy,
    include = { User: false, Topic: false },
  }: {
    where?: Prisma.FollowTopicWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.FollowTopicOrderByWithRelationInput>;
    include?: Prisma.FollowTopicInclude;
  }) {
    return this.prisma.followTopic.findFirst({ where, orderBy, include });
  }

  findUnique({
    where,
    include = { User: false, Topic: false },
  }: {
    where: Prisma.FollowTopicWhereUniqueInput;
    include?: Prisma.FollowTopicInclude;
  }) {
    return this.prisma.followTopic.findUnique({ where, include });
  }

  update({
    where,
    data,
    include = { User: false, Topic: false },
  }: {
    where: Prisma.FollowTopicWhereUniqueInput;
    data: Prisma.FollowTopicUpdateInput;
    include?: Prisma.FollowTopicInclude;
  }) {
    return this.prisma.followTopic.update({ where, data, include });
  }

  delete({
    where,
    include = { User: false, Topic: false },
  }: {
    where: Prisma.FollowTopicWhereUniqueInput;
    include?: Prisma.FollowTopicInclude;
  }) {
    return this.prisma.followTopic.delete({ where, include });
  }

  createIfNotExists({ userId, topicId }: { userId: string; topicId: string }) {
    return this.prisma.$transaction(async (prisma) => {
      let followTopic;
      let created = false;
      followTopic = await prisma.followTopic.findUnique({
        where: { userId_topicId: { userId, topicId } },
      });
      if (!followTopic) {
        followTopic = await prisma.followTopic.create({
          data: { userId, topicId },
        });
        created = true;
      }
      return { data: followTopic, created };
    });
  }

  deleteIfExists({ userId, topicId }: { userId: string; topicId: string }) {
    return this.prisma.$transaction(async (prisma) => {
      let followTopic;
      let deleted = false;
      followTopic = await prisma.followTopic.findUnique({
        where: { userId_topicId: { userId, topicId } },
      });
      if (followTopic) {
        followTopic = await prisma.followTopic.delete({
          where: { userId_topicId: { userId, topicId } },
        });
        deleted = true;
      }
      return { data: followTopic, deleted };
    });
  }
}
