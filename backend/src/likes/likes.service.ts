import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LikesService {
  private logger = new Logger(LikesService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('Initializing Likes Service...');
  }

  findOne({
    where,
    include = { User: false, Note: false },
  }: {
    where: Prisma.LikeWhereUniqueInput;
    include?: Prisma.LikeInclude;
  }) {
    return this.prisma.like.findUnique({ where, include });
  }

  findFirst({
    where,
    orderBy,
    include = { User: false, Note: false },
  }: {
    where: Prisma.LikeWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.LikeOrderByWithRelationInput>;
    include?: Prisma.LikeInclude;
  }) {
    return this.prisma.like.findFirst({ where, orderBy, include });
  }

  findMany({
    where,
    orderBy,
    include = { User: false, Note: false },
    skip,
    take,
  }: {
    where: Prisma.LikeWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.LikeOrderByWithRelationInput>;
    include?: Prisma.LikeInclude;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.$transaction([
      this.prisma.like.findMany({ where, orderBy, include, skip, take }),
      this.prisma.like.count({ where }),
    ]);
  }

  count({ where }: { where: Prisma.LikeWhereInput }) {
    return this.prisma.like.count({ where });
  }

  createIfNotExists({ userId, noteId }: { userId: string; noteId: string }) {
    return this.prisma.$transaction(async (prisma) => {
      let like;
      like = await prisma.like.findUnique({
        where: { userId_noteId: { userId, noteId } },
      });
      if (!like) {
        like = await prisma.like.create({
          data: { userId, noteId },
        });
      }
      return like;
    });
  }

  removeIfExist({ userId, noteId }: { userId: string; noteId: string }) {
    return this.prisma.$transaction(async (prisma) => {
      let like;
      like = await prisma.like.findUnique({
        where: { userId_noteId: { userId, noteId } },
      });
      if (like) {
        like = await prisma.like.delete({
          where: { userId_noteId: { userId, noteId } },
        });
      }
      return like;
    });
  }
}
