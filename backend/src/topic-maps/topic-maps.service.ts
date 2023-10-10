import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TopicMapsService {
  private logger = new Logger(TopicMapsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('Initializing TopicMaps Service...');
  }

  async create({
    data,
    include = { Note: false, Topic: false },
  }: {
    data: Prisma.TopicMapCreateInput;
    include?: Prisma.TopicMapInclude;
  }) {
    return this.prisma.topicMap.create({
      data,
      include,
    });
  }

  async findAll({
    include = { Note: false, Topic: false },
  }: {
    include?: Prisma.TopicMapInclude;
  } = {}) {
    return this.prisma.topicMap.findMany({ include });
  }

  async findMany({
    where,
    orderBy = { createdAt: 'asc' },
    include = { Note: false, Topic: false },
    take,
    skip,
  }: {
    where?: Prisma.TopicMapWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.TopicMapOrderByWithRelationInput>;
    include?: Prisma.TopicMapInclude;
    take?: number;
    skip?: number;
  }) {
    return this.prisma.$transaction([
      this.prisma.topicMap.findMany({ where, orderBy, include, take, skip }),
      this.prisma.topicMap.count({ where }),
    ]);
  }

  async count({ where }: { where?: Prisma.TopicMapWhereInput }) {
    return this.prisma.topicMap.count({ where });
  }

  async findOne({
    where,
    include = { Note: false, Topic: false },
  }: {
    where: Prisma.TopicMapWhereUniqueInput;
    include?: Prisma.TopicMapInclude;
  }) {
    return this.prisma.topicMap.findUnique({ where, include });
  }

  async update({
    where,
    data,
    include = { Note: false, Topic: false },
  }: {
    where: Prisma.TopicMapWhereUniqueInput;
    data: Prisma.TopicMapUpdateInput;
    include?: Prisma.TopicMapInclude;
  }) {
    return this.prisma.topicMap.update({
      where,
      data,
      include,
    });
  }

  async delete({
    where,
    include = { Note: false, Topic: false },
  }: {
    where: Prisma.TopicMapWhereUniqueInput;
    include?: Prisma.TopicMapInclude;
  }) {
    return this.prisma.topicMap.delete({
      where,
      include,
    });
  }
}
