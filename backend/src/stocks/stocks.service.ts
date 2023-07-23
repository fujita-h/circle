import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class StocksService {
  private logger = new Logger(StocksService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('Initializing Stocks Service...');
  }

  create({
    data,
    include = { Label: false, User: false, Note: false },
  }: {
    data: Prisma.StockCreateInput;
    include?: Prisma.StockInclude;
  }) {
    return this.prisma.stock.create({ data, include });
  }

  findOne({
    where,
    include = { Label: false, User: false, Note: false },
  }: {
    where: Prisma.StockWhereUniqueInput;
    include?: Prisma.StockInclude;
  }) {
    return this.prisma.stock.findUnique({ where, include });
  }

  findFirst({
    where,
    orderBy,
    include = { Label: false, User: false, Note: false },
  }: {
    where: Prisma.StockWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.StockOrderByWithRelationInput>;
    include?: Prisma.StockInclude;
  }) {
    return this.prisma.stock.findFirst({ where, orderBy, include });
  }

  findMany({
    where,
    orderBy,
    include = { Label: false, User: false, Note: false },
    skip,
    take,
  }: {
    where: Prisma.StockWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.StockOrderByWithRelationInput>;
    include?: Prisma.StockInclude;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.$transaction([
      this.prisma.stock.findMany({ where, orderBy, include, skip, take }),
      this.prisma.stock.count({ where }),
    ]);
  }

  findManyDistinct({
    select,
    where,
    distinct,
    orderBy,
    skip,
    take,
  }: {
    select?: Prisma.StockSelect;
    where?: Prisma.StockWhereInput;
    distinct?: Prisma.StockScalarFieldEnum[];
    orderBy?: Prisma.Enumerable<Prisma.StockOrderByWithRelationInput>;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.stock.findMany({ select, where, orderBy, distinct, skip, take });
  }

  count({ where }: { where: Prisma.StockWhereInput }) {
    return this.prisma.stock.count({ where });
  }

  update({
    where,
    data,
    include = { Label: false, User: false, Note: false },
  }: {
    where: Prisma.StockWhereUniqueInput;
    data: Prisma.StockUpdateInput;
    include?: Prisma.StockInclude;
  }) {
    return this.prisma.stock.update({ where, data, include });
  }

  delete({
    where,
    include = { Label: false, User: false, Note: false },
  }: {
    where: Prisma.StockWhereUniqueInput;
    include?: Prisma.StockInclude;
  }) {
    return this.prisma.stock.delete({ where, include });
  }

  createIfNotExists({
    userId,
    noteId,
    labelId,
  }: {
    userId: string;
    noteId: string;
    labelId: string;
  }) {
    return this.prisma.$transaction(async (prisma) => {
      let stock;
      stock = await prisma.stock.findUnique({
        where: { userId_noteId_labelId: { userId, noteId, labelId } },
      });
      if (!stock) {
        stock = await prisma.stock.create({
          data: { userId, noteId, labelId },
        });
      }
      return stock;
    });
  }

  deleteIfNotExists({
    userId,
    noteId,
    labelId,
  }: {
    userId: string;
    noteId: string;
    labelId: string;
  }) {
    return this.prisma.$transaction(async (prisma) => {
      let stock;
      stock = await prisma.stock.findUnique({
        where: { userId_noteId_labelId: { userId, noteId, labelId } },
      });
      if (stock) {
        stock = await prisma.stock.delete({
          where: { userId_noteId_labelId: { userId, noteId, labelId } },
        });
      }
      return stock;
    });
  }
}
