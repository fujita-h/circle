import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class StockLabelsService {
  private logger = new Logger(StockLabelsService.name);
  constructor(private configService: ConfigService) {
    this.logger.log('Initializing Stocks Service...');
  }

  create({
    data,
    include = { _count: false, Stocks: false, User: false },
  }: {
    data: Prisma.StockLabelCreateInput;
    include?: Prisma.StockLabelInclude;
  }) {
    return prisma.stockLabel.create({ data, include });
  }

  findOne({
    where,
    include = { _count: false, Stocks: false, User: false },
  }: {
    where: Prisma.StockLabelWhereUniqueInput;
    include?: Prisma.StockLabelInclude;
  }) {
    return prisma.stockLabel.findUnique({ where, include });
  }

  findFirst({
    where,
    orderBy,
    include = { _count: false, Stocks: false, User: false },
  }: {
    where: Prisma.StockLabelWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.StockLabelOrderByWithRelationInput>;
    include?: Prisma.StockLabelInclude;
  }) {
    return prisma.stockLabel.findFirst({ where, orderBy, include });
  }

  findMany({
    where,
    orderBy,
    include = { _count: false, Stocks: false, User: false },
    skip,
    take,
  }: {
    where: Prisma.StockLabelWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.StockLabelOrderByWithRelationInput>;
    include?: Prisma.StockLabelInclude;
    skip?: number;
    take?: number;
  }) {
    return prisma.$transaction([
      prisma.stockLabel.findMany({ where, orderBy, include, skip, take }),
      prisma.stockLabel.count({ where }),
    ]);
  }

  count({ where }: { where: Prisma.StockLabelWhereInput }) {
    return prisma.stockLabel.count({ where });
  }

  update({
    where,
    data,
    include = { _count: false, Stocks: false, User: false },
  }: {
    where: Prisma.StockLabelWhereUniqueInput;
    data: Prisma.StockLabelUpdateInput;
    include?: Prisma.StockLabelInclude;
  }) {
    return prisma.stockLabel.update({ where, data, include });
  }

  delete({
    where,
    include = { _count: false, Stocks: false, User: false },
  }: {
    where: Prisma.StockLabelWhereUniqueInput;
    include?: Prisma.StockLabelInclude;
  }) {
    return prisma.stockLabel.delete({ where, include });
  }
}
