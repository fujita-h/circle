import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchRequest, SortOptions } from '@elastic/elasticsearch/lib/api/types';
import { Prisma, PrismaClient } from '@prisma/client';
import { EsService } from '../es/es.service';
import { init } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();
const cuid = init({ length: 24 });

@Injectable()
export class UsersService {
  private logger = new Logger(UsersService.name);
  private esIndex = 'user';

  constructor(
    private readonly configService: ConfigService,
    private readonly esService: EsService,
  ) {
    this.logger.log('Initializing Users Service...');

    // Initialize users index
    esService.init(this.esIndex);
  }

  create({
    data,
    include = { _count: false },
  }: {
    data: Prisma.UserCreateInput;
    include?: Prisma.UserInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({ data: { id: cuid(), ...data } });
      const esResponse = await this.esService.create(this.esIndex, user.id, { ...user });
      if (esResponse.result === 'created' || esResponse.result === 'updated') {
        return prisma.user.findUnique({ where: { id: user.id }, include });
      } else {
        throw new Error('Failed to create user in Elasticsearch');
      }
    });
  }

  findAll({ include = { _count: false } }: { include?: Prisma.UserInclude } = {}) {
    return prisma.user.findMany({ include });
  }

  findMany({
    where,
    orderBy,
    include = { _count: false },
    take,
    skip,
  }: {
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.UserOrderByWithRelationInput>;
    include?: Prisma.UserInclude;
    take?: number;
    skip?: number;
  }) {
    return prisma.user.findMany({ where, orderBy, include, take, skip });
  }

  count({ where }: { where?: Prisma.UserWhereInput }) {
    return prisma.user.count({ where });
  }

  findFirst({
    where,
    orderBy = { id: 'asc' },
    include = { _count: false },
  }: {
    where: Prisma.UserWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.UserOrderByWithRelationInput>;
    include?: Prisma.UserInclude;
  }) {
    return prisma.user.findFirst({ where, orderBy, include });
  }

  findOne({
    where,
    include = { _count: false },
  }: {
    where: Prisma.UserWhereUniqueInput;
    include?: Prisma.UserInclude;
  }) {
    return prisma.user.findUnique({ where, include });
  }

  search({
    query,
    size,
    skip,
    sort,
    desc,
  }: {
    query?: string;
    size?: number;
    skip?: number;
    sort?: string;
    desc?: boolean;
  }) {
    const sortOptions: SortOptions = sort ? { [sort]: desc ? 'desc' : 'asc' } : {};
    const body: SearchRequest = {
      query: {
        bool: {
          must: [
            {
              query_string: {
                query: query || '*',
                fields: ['name', 'email'],
              },
            },
          ],
        },
      },
      from: skip || 0,
      size: size || 10,
      sort: [sortOptions],
    };
    return this.esService.search(this.esIndex, body);
  }

  update({
    where,
    data,
    include = { _count: false },
  }: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
    include?: Prisma.UserInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const user = await prisma.user.update({ where, data });
      const esResponse = await this.esService.create(this.esIndex, user.id, { ...user });
      if (esResponse.result === 'created' || esResponse.result === 'updated') {
        return prisma.user.findUnique({ where: { id: user.id }, include });
      } else {
        throw new Error('Failed to update user in Elasticsearch');
      }
    });
  }

  remove({
    where,
    include = { _count: false },
  }: {
    where: Prisma.UserWhereUniqueInput;
    include?: Prisma.UserInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const user = await prisma.user.delete({ where, include });
      const esResponse = await this.esService.delete(this.esIndex, user.id);
      if (esResponse.result === 'deleted' || esResponse.result === 'not_found') {
        return user;
      } else {
        throw new Error('Failed to delete user in Elasticsearch');
      }
    });
  }
}
