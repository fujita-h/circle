import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { init } from '@paralleldrive/cuid2';
import { AzblobService } from '../azblob/azblob.service';

const prisma = new PrismaClient();
const cuid = init({ length: 24 });

@Injectable()
export class CommentsService {
  private logger = new Logger(CommentsService.name);
  private blobContainerName = 'comment';

  constructor(private configService: ConfigService, private readonly blobService: AzblobService) {
    this.logger.log('Initializing Comments Service...');
    // Initialize blob container
    this.blobService.init(this.blobContainerName);
  }

  findOne({
    where,
    include = { user: false, note: false },
  }: {
    where: Prisma.CommentWhereUniqueInput;
    include?: Prisma.CommentInclude;
  }) {
    return prisma.comment.findUnique({ where, include });
  }

  findFirst({
    where,
    orderBy,
    include = { user: false, note: false },
  }: {
    where: Prisma.CommentWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.CommentOrderByWithRelationInput>;
    include?: Prisma.CommentInclude;
  }) {
    return prisma.comment.findFirst({ where, orderBy, include });
  }

  findMany({
    where,
    orderBy,
    include = { user: false, note: false },
    skip,
    take,
  }: {
    where: Prisma.CommentWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.CommentOrderByWithRelationInput>;
    include?: Prisma.CommentInclude;
    skip?: number;
    take?: number;
  }) {
    return prisma.comment.findMany({ where, orderBy, include, skip, take });
  }

  count({ where }: { where: Prisma.CommentWhereInput }) {
    return prisma.comment.count({ where });
  }

  create({
    data,
    body,
    include = { user: false, note: false },
  }: {
    data: Prisma.CommentCreateInput;
    body: string;
    include?: Prisma.CommentInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const blobCuid = cuid();
      const comment = await prisma.comment.create({
        data: { id: cuid(), ...data, blobPointer: blobCuid },
        include,
      });

      // upload blob
      const blobName = `${comment.id}/${blobCuid}.md`;
      const blobResponse = await this.blobService.uploadBlob(
        this.blobContainerName,
        blobName,
        'text/markdown',
        body,
      );

      if (blobResponse.errorCode) {
        throw new Error('Failed to upload blob');
      }

      return comment;
    });
  }

  update({
    where,
    data,
    include = { user: false, note: false },
  }: {
    where: Prisma.CommentWhereUniqueInput;
    data: Prisma.CommentUpdateInput;
    include?: Prisma.CommentInclude;
  }) {
    return prisma.comment.update({ where, data, include });
  }

  delete({
    where,
    include = { user: false, note: false },
  }: {
    where: Prisma.CommentWhereUniqueInput;
    include?: Prisma.CommentInclude;
  }) {
    return prisma.comment.delete({ where, include });
  }
}
