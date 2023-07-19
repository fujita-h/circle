import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SortOptions } from '@elastic/elasticsearch/lib/api/types';
import { Prisma, PrismaClient } from '@prisma/client';
import { EsService } from '../es/es.service';
import { init } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();
const cuid = init({ length: 24 });

@Injectable()
export class GroupsService {
  private logger = new Logger(GroupsService.name);
  private esGroupIndex = 'group';

  constructor(
    private readonly configService: ConfigService,
    private readonly esService: EsService,
  ) {
    this.logger.log('Initializing Users Service...');

    // Initialize users index
    esService.init(this.esGroupIndex);
  }

  create({
    data,
    include = { _count: false },
  }: {
    data: Prisma.GroupCreateInput;
    include?: Prisma.GroupInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const group = await prisma.group.create({ data: { id: cuid(), ...data } });
      const esResponse = await this.esService.create(this.esGroupIndex, group.id, { ...group });
      if (esResponse.result === 'created' || esResponse.result === 'updated') {
        return prisma.group.findUnique({ where: { id: group.id }, include });
      } else {
        throw new Error('Failed to create group in Elasticsearch');
      }
    });
  }

  findAll({ include = { _count: false } }: { include?: Prisma.GroupInclude } = {}) {
    return prisma.group.findMany({ include });
  }

  findMany({
    where,
    orderBy,
    include = { _count: false },
    take,
    skip,
  }: {
    where?: Prisma.GroupWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.UserOrderByWithRelationInput>;
    include?: Prisma.GroupInclude;
    take?: number;
    skip?: number;
  }) {
    return prisma.group.findMany({ where, orderBy, include, take, skip });
  }

  count({ where }: { where?: Prisma.GroupWhereInput }) {
    return prisma.group.count({ where });
  }

  findFirst({
    where,
    orderBy = { id: 'asc' },
    include = { _count: false },
  }: {
    where: Prisma.GroupWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.GroupOrderByWithRelationInput>;
    include?: Prisma.GroupInclude;
  }) {
    return prisma.group.findFirst({ where, orderBy, include });
  }

  findOne({
    where,
    include = { _count: false },
  }: {
    where: Prisma.GroupWhereUniqueInput;
    include?: Prisma.GroupInclude;
  }) {
    return prisma.group.findUnique({ where, include });
  }

  findMembers({
    where,
    orderBy,
    include,
    take,
    skip,
  }: {
    where?: Prisma.MembershipWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.MembershipOrderByWithRelationInput>;
    include?: Prisma.MembershipInclude;
    take?: number;
    skip?: number;
  }) {
    return prisma.membership.findMany({ where, include, orderBy, take, skip });
  }

  countMembers({ where }: { where?: Prisma.MembershipWhereInput }) {
    return prisma.membership.count({ where });
  }

  update({
    where,
    data,
    include = { _count: false },
  }: {
    where: Prisma.GroupWhereUniqueInput;
    data: Prisma.GroupUpdateInput;
    include?: Prisma.GroupInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const group = await prisma.group.update({ where, data });
      const esResponse = await this.esService.create(this.esGroupIndex, group.id, { ...group });
      if (esResponse.result === 'created' || esResponse.result === 'updated') {
        return prisma.group.findUnique({ where: { id: group.id }, include });
      } else {
        throw new Error('Failed to update group in Elasticsearch');
      }
    });
  }

  remove({
    where,
    include = { _count: false },
  }: {
    where: Prisma.GroupWhereUniqueInput;
    include?: Prisma.GroupInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const group = await prisma.group.delete({ where, include });
      const esResponse = await this.esService.delete(this.esGroupIndex, group.id.toString());
      if (esResponse.result === 'deleted' || esResponse.result === 'not_found') {
        return group;
      } else {
        throw new Error('Failed to delete group in Elasticsearch');
      }
    });
  }
}
