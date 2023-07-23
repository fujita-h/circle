import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { init } from '@paralleldrive/cuid2';
import { AzblobService } from '../azblob/azblob.service';

const cuid = init({ length: 24 });

@Injectable()
export class CommentsService {
  private logger = new Logger(CommentsService.name);
  private blobContainerName = 'comment';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly blobService: AzblobService,
  ) {
    this.logger.log('Initializing Comments Service...');
    // Initialize blob container
    this.blobService.init(this.blobContainerName);
  }

  findOne({
    where,
    include = { User: false, Note: false },
  }: {
    where: Prisma.CommentWhereUniqueInput;
    include?: Prisma.CommentInclude;
  }) {
    return this.prisma.comment.findUnique({ where, include });
  }

  findFirst({
    where,
    orderBy,
    include = { User: false, Note: false },
  }: {
    where: Prisma.CommentWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.CommentOrderByWithRelationInput>;
    include?: Prisma.CommentInclude;
  }) {
    return this.prisma.comment.findFirst({ where, orderBy, include });
  }

  findMany({
    where,
    orderBy,
    include = { User: false, Note: false },
    skip,
    take,
  }: {
    where: Prisma.CommentWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.CommentOrderByWithRelationInput>;
    include?: Prisma.CommentInclude;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.$transaction([
      this.prisma.comment.findMany({ where, orderBy, include, skip, take }),
      this.prisma.comment.count({ where }),
    ]);
  }

  count({ where }: { where: Prisma.CommentWhereInput }) {
    return this.prisma.comment.count({ where });
  }

  create({
    data,
    body,
    include = { User: false, Note: false },
  }: {
    data: Prisma.CommentCreateInput;
    body: string;
    include?: Prisma.CommentInclude;
  }) {
    return this.prisma.$transaction(async (prisma) => {
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
    include = { User: false, Note: false },
  }: {
    where: Prisma.CommentWhereUniqueInput;
    data: Prisma.CommentUpdateInput;
    include?: Prisma.CommentInclude;
  }) {
    return this.prisma.comment.update({ where, data, include });
  }

  delete({
    where,
    include = { User: false, Note: false },
  }: {
    where: Prisma.CommentWhereUniqueInput;
    include?: Prisma.CommentInclude;
  }) {
    return this.prisma.comment.delete({ where, include });
  }
}
