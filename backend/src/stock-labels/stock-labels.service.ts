import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class StockLabelsService {
  private logger = new Logger(StockLabelsService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('Initializing Stocks Service...');
  }

  create({
    data,
    include = { _count: false, Stocks: false, User: false },
  }: {
    data: Prisma.StockLabelCreateInput;
    include?: Prisma.StockLabelInclude;
  }) {
    return this.prisma.stockLabel.create({ data, include });
  }

  findOne({
    where,
    include = { _count: false, Stocks: false, User: false },
  }: {
    where: Prisma.StockLabelWhereUniqueInput;
    include?: Prisma.StockLabelInclude;
  }) {
    return this.prisma.stockLabel.findUnique({ where, include });
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
    return this.prisma.stockLabel.findFirst({ where, orderBy, include });
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
    return this.prisma.$transaction([
      this.prisma.stockLabel.findMany({ where, orderBy, include, skip, take }),
      this.prisma.stockLabel.count({ where }),
    ]);
  }

  count({ where }: { where: Prisma.StockLabelWhereInput }) {
    return this.prisma.stockLabel.count({ where });
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
    return this.prisma.stockLabel.update({ where, data, include });
  }

  delete({
    where,
    include = { _count: false, Stocks: false, User: false },
  }: {
    where: Prisma.StockLabelWhereUniqueInput;
    include?: Prisma.StockLabelInclude;
  }) {
    return this.prisma.stockLabel.delete({ where, include });
  }
}
