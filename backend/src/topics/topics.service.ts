import { Injectable, Logger } from '@nestjs/common';
import { init } from '@paralleldrive/cuid2';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

const cuid = init({ length: 24 });

@Injectable()
export class TopicsService {
  private logger = new Logger(TopicsService.name);

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('Initializing Topics Service...');
  }

  async create({
    data,
    include = { Notes: false, _count: false },
  }: {
    data: Prisma.TopicCreateInput;
    include?: Prisma.TopicInclude;
  }) {
    return this.prisma.topic.create({
      data: { id: cuid(), ...data },
      include,
    });
  }

  async findAll({
    include = { Notes: false, _count: false },
  }: {
    include?: Prisma.TopicInclude;
  } = {}) {
    return this.prisma.topic.findMany({ include });
  }

  async findMany({
    where,
    orderBy = { name: 'asc' },
    include = { Notes: false, _count: false },
    take,
    skip,
  }: {
    where?: Prisma.TopicWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.TopicOrderByWithRelationInput>;
    include?: Prisma.TopicInclude;
    take?: number;
    skip?: number;
  }) {
    return this.prisma.$transaction([
      this.prisma.topic.findMany({ where, orderBy, include, take, skip }),
      this.prisma.topic.count({ where }),
    ]);
  }

  async findOne({
    where,
    include = { Notes: false, _count: false },
  }: {
    where: Prisma.TopicWhereUniqueInput;
    include?: Prisma.TopicInclude;
  }) {
    return this.prisma.topic.findUnique({ where, include });
  }

  async update({
    where,
    data,
    include = { Notes: false, _count: false },
  }: {
    where: Prisma.TopicWhereUniqueInput;
    data: Prisma.TopicUpdateInput;
    include?: Prisma.TopicInclude;
  }) {
    return this.prisma.topic.update({ where, data, include });
  }

  async delete({
    where,
    include = { Notes: false, _count: false },
  }: {
    where: Prisma.TopicWhereUniqueInput;
    include?: Prisma.TopicInclude;
  }) {
    return this.prisma.topic.delete({ where, include });
  }
}
