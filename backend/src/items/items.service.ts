import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SortOptions } from '@elastic/elasticsearch/lib/api/types';
import { Prisma, PrismaClient } from '@prisma/client';
import * as cuid from 'cuid';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';

const prisma = new PrismaClient();

@Injectable()
export class ItemsService {
  private logger = new Logger(ItemsService.name);
  private blobContainerName = 'item';
  private esIndex = 'item';

  constructor(
    private readonly configService: ConfigService,
    private readonly blobsService: AzblobService,
    private readonly esService: EsService,
  ) {
    this.logger.log('Initializing Items Service...');

    // Initialize users index
    this.esService.init(this.esIndex);
    // Initialize blob container
    this.blobsService.init(this.blobContainerName);
  }

  create({
    data,
    body,
    include = { _count: false },
  }: {
    data: Prisma.ItemCreateInput;
    body: string;
    include?: Prisma.ItemInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const blobCuid = cuid();
      const item = await prisma.item.create({ data: { ...data, blobPointer: blobCuid } });

      // Upload blob
      const blobName = `${item.id}/${blobCuid}.md`;
      await this.blobsService.uploadBlob(this.blobContainerName, blobName, 'text/markdown', body);

      // create elasticsearch document
      const esBody = { ...item, body: body };
      const esResponse = await this.esService.create(this.esIndex, item.id.toString(), esBody);

      // if elasticsearch document creation failed, delete blob and throw error
      if (esResponse.result === 'created' || esResponse.result === 'updated') {
        return prisma.item.findUnique({ where: { id: item.id }, include });
      } else {
        await this.blobsService.deleteBlob(this.blobContainerName, blobName);
        throw new Error('Failed to create elasticsearch document');
      }
    });
  }

  createDraft({
    data,
    body,
    include = { _count: false },
  }: {
    data: Prisma.ItemCreateInput;
    body: string;
    include?: Prisma.ItemInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const blobCuid = cuid();
      const item = await prisma.item.create({ data: { ...data, draftPointer: blobCuid } });

      // Upload blob
      const blobName = `${item.id}/${blobCuid}.draft.md`;
      await this.blobsService.uploadBlob(this.blobContainerName, blobName, 'text/markdown', body);

      return prisma.item.findUnique({ where: { id: item.id }, include });
    });
  }

  findAll({ include = { _count: false } }: { include?: Prisma.ItemInclude } = {}) {
    return prisma.item.findMany({ include });
  }

  findOne({
    where,
    include = { _count: false },
  }: {
    where: Prisma.ItemWhereUniqueInput;
    include?: Prisma.ItemInclude;
  }) {
    return prisma.item.findUnique({ where, include });
  }

  findFirst({
    where,
    orderBy,
    include = { _count: false },
  }: {
    where: Prisma.ItemWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.ItemOrderByWithRelationInput>;
    include?: Prisma.ItemInclude;
  }) {
    return prisma.item.findFirst({ where, orderBy, include });
  }

  findMany({
    where,
    orderBy,
    include = { _count: false },
    take,
    skip,
  }: {
    where: Prisma.ItemWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.ItemOrderByWithRelationInput>;
    include?: Prisma.ItemInclude;
    skip?: number;
    take?: number;
  }) {
    return prisma.item.findMany({ where, orderBy, include, skip, take });
  }

  count({ where }: { where: Prisma.ItemWhereInput }) {
    return prisma.item.count({ where });
  }

  update({
    where,
    data,
    body,
    include = { _count: false },
  }: {
    where: Prisma.ItemWhereUniqueInput;
    data: Prisma.ItemUpdateInput;
    body: string;
    include?: Prisma.ItemInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const blobCuid = cuid();
      const item = await prisma.item.update({
        where,
        // delete draftPointer if it exists
        data: { ...data, blobPointer: blobCuid, draftPointer: null },
      });

      if (!item) {
        throw new Error('Item not found');
      }

      // Upload blob
      const blobName = `${item.id}/${blobCuid}.md`;
      await this.blobsService.uploadBlob(this.blobContainerName, blobName, 'text/markdown', body);

      // update elasticsearch document
      const esBody = { ...item, body: body };
      const esResponse = await this.esService.create(this.esIndex, item.id, esBody);

      // if elasticsearch document update failed, delete blob and throw error
      if (esResponse.result === 'created' || esResponse.result === 'updated') {
        return prisma.item.findUnique({ where: { id: item.id }, include });
      } else {
        await this.blobsService.deleteBlob(this.blobContainerName, blobName);
        throw new Error('Failed to update elasticsearch document');
      }
    });
  }

  updateDraft({
    where,
    data,
    body,
    include = { _count: false },
  }: {
    where: Prisma.ItemWhereUniqueInput;
    data: Prisma.ItemUpdateInput;
    body: string;
    include?: Prisma.ItemInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const current = await prisma.item.findUnique({ where });

      if (!current) {
        throw new Error('Item not found');
      }

      // if draftPointer exists, use same blob. otherwise, create new blob
      const blobCuid = current.draftPointer || cuid();
      const item = await prisma.item.update({ where, data: { ...data, draftPointer: blobCuid } });

      if (!item) {
        throw new Error('Item not found');
      }

      // Upload blob
      const blobName = `${item.id}/${blobCuid}.draft.md`;
      await this.blobsService.uploadBlob(this.blobContainerName, blobName, 'text/markdown', body);

      return prisma.item.findUnique({ where: { id: item.id }, include });
    });
  }

  // update method required to both data and body, so we need a separate method for soft delete.
  softRemove({ where }: { where: Prisma.ItemWhereUniqueInput }) {
    return prisma.$transaction(async (prisma) => {
      const item = await prisma.item.update({
        where,
        data: { status: 'DELETED' },
      });
      if (!item) {
        throw new Error('Item not found');
      }
      const esResponse = await this.esService.delete(this.esIndex, item.id);
      if (esResponse.result === 'deleted' || esResponse.result === 'not_found') {
        return item;
      } else {
        throw new Error('Failed to delete group in Elasticsearch');
      }
    });
  }

  remove({
    where,
    include = { _count: false },
  }: {
    where: Prisma.ItemWhereUniqueInput;
    include?: Prisma.ItemInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const item = await prisma.item.delete({ where, include });
      const esResponse = await this.esService.delete(this.esIndex, item.id);
      if (esResponse.result === 'deleted' || esResponse.result === 'not_found') {
        return item;
      } else {
        throw new Error('Failed to delete group in Elasticsearch');
      }
    });
  }
}
