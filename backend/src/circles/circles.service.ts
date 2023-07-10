import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SortOptions } from '@elastic/elasticsearch/lib/api/types';
import { Prisma, PrismaClient } from '@prisma/client';
import { EsService } from '../es/es.service';
import { init } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();
const cuid = init({ length: 24 });

@Injectable()
export class CirclesService {
  private logger = new Logger(CirclesService.name);
  private esCircleIndex = 'circle';

  constructor(
    private readonly configService: ConfigService,
    private readonly esService: EsService,
  ) {
    this.logger.log('Initializing Users Service...');

    // Initialize users index
    esService.init(this.esCircleIndex);
  }

  create({
    data,
    include = { _count: false },
  }: {
    data: Prisma.CircleCreateInput;
    include?: Prisma.CircleInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const circle = await prisma.circle.create({ data: { id: cuid(), ...data } });
      const esResponse = await this.esService.create(this.esCircleIndex, circle.id, { ...circle });
      if (esResponse.result === 'created' || esResponse.result === 'updated') {
        return prisma.circle.findUnique({ where: { id: circle.id }, include });
      } else {
        throw new Error('Failed to create circle in Elasticsearch');
      }
    });
  }

  findAll({ include = { _count: false } }: { include?: Prisma.CircleInclude } = {}) {
    return prisma.circle.findMany({ include });
  }

  findMany({
    where,
    orderBy,
    include = { _count: false },
    take,
    skip,
  }: {
    where?: Prisma.CircleWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.UserOrderByWithRelationInput>;
    include?: Prisma.CircleInclude;
    take?: number;
    skip?: number;
  }) {
    return prisma.circle.findMany({ where, orderBy, include, take, skip });
  }

  count({ where }: { where?: Prisma.CircleWhereInput }) {
    return prisma.circle.count({ where });
  }

  findFirst({
    where,
    orderBy = { id: 'asc' },
    include = { _count: false },
  }: {
    where: Prisma.CircleWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.CircleOrderByWithRelationInput>;
    include?: Prisma.CircleInclude;
  }) {
    return prisma.circle.findFirst({ where, orderBy, include });
  }

  findOne({
    where,
    include = { _count: false },
  }: {
    where: Prisma.CircleWhereUniqueInput;
    include?: Prisma.CircleInclude;
  }) {
    return prisma.circle.findUnique({ where, include });
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
    where: Prisma.CircleWhereUniqueInput;
    data: Prisma.CircleUpdateInput;
    include?: Prisma.CircleInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const circle = await prisma.circle.update({ where, data });
      const esResponse = await this.esService.create(this.esCircleIndex, circle.id, { ...circle });
      if (esResponse.result === 'created' || esResponse.result === 'updated') {
        return prisma.circle.findUnique({ where: { id: circle.id }, include });
      } else {
        throw new Error('Failed to update circle in Elasticsearch');
      }
    });
  }

  remove({
    where,
    include = { _count: false },
  }: {
    where: Prisma.CircleWhereUniqueInput;
    include?: Prisma.CircleInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const circle = await prisma.circle.delete({ where, include });
      const esResponse = await this.esService.delete(this.esCircleIndex, circle.id.toString());
      if (esResponse.result === 'deleted' || esResponse.result === 'not_found') {
        return circle;
      } else {
        throw new Error('Failed to delete circle in Elasticsearch');
      }
    });
  }
}
