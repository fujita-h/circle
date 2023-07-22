import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { init } from '@paralleldrive/cuid2';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';

const prisma = new PrismaClient();
const cuid = init({ length: 24 });

@Injectable()
export class NotesService {
  private logger = new Logger(NotesService.name);
  private blobContainerName = 'note';
  private esIndex = 'note';

  constructor(
    private readonly configService: ConfigService,
    private readonly blobsService: AzblobService,
    private readonly esService: EsService,
  ) {
    this.logger.log('Initializing Notes Service...');

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
    data: Prisma.NoteCreateInput;
    body: string;
    include?: Prisma.NoteInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const blobCuid = cuid();
      const note = await prisma.note.create({
        data: { id: cuid(), ...data, blobPointer: blobCuid },
        include: { ...include, user: true },
      });

      // Upload blob
      const blobName = `${note.id}/${blobCuid}.md`;
      await this.blobsService.uploadBlob(this.blobContainerName, blobName, 'text/markdown', body);

      // create elasticsearch document
      const esBody = { ...note, body: body };
      const esResponse = await this.esService.create(this.esIndex, note.id.toString(), esBody);

      // if elasticsearch document creation failed, delete blob and throw error
      if (esResponse.result === 'created' || esResponse.result === 'updated') {
        return prisma.note.findUnique({ where: { id: note.id }, include });
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
    data: Prisma.NoteCreateInput;
    body: string;
    include?: Prisma.NoteInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const blobCuid = cuid();
      const note = await prisma.note.create({
        data: { id: cuid(), ...data, draftBlobPointer: blobCuid },
      });

      // Upload blob
      const blobName = `${note.id}/${blobCuid}.draft.md`;
      await this.blobsService.uploadBlob(this.blobContainerName, blobName, 'text/markdown', body);

      return prisma.note.findUnique({ where: { id: note.id }, include });
    });
  }

  findAll({ include = { _count: false } }: { include?: Prisma.NoteInclude } = {}) {
    return prisma.note.findMany({ include });
  }

  findOne({
    where,
    include = { _count: false },
  }: {
    where: Prisma.NoteWhereUniqueInput;
    include?: Prisma.NoteInclude;
  }) {
    return prisma.note.findUnique({ where, include });
  }

  findFirst({
    where,
    orderBy,
    include = { _count: false },
  }: {
    where: Prisma.NoteWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.NoteOrderByWithRelationInput>;
    include?: Prisma.NoteInclude;
  }) {
    return prisma.note.findFirst({ where, orderBy, include });
  }

  findMany({
    where,
    orderBy,
    include = { _count: false },
    take,
    skip,
  }: {
    where: Prisma.NoteWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.NoteOrderByWithRelationInput>;
    include?: Prisma.NoteInclude;
    skip?: number;
    take?: number;
  }) {
    return prisma.$transaction([
      prisma.note.findMany({ where, orderBy, include, skip, take }),
      prisma.note.count({ where }),
    ]);
  }

  count({ where }: { where: Prisma.NoteWhereInput }) {
    return prisma.note.count({ where });
  }

  update({
    where,
    data,
    body,
    include = { _count: false },
  }: {
    where: Prisma.NoteWhereUniqueInput;
    data: Prisma.NoteUpdateInput;
    body: string;
    include?: Prisma.NoteInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const blobCuid = cuid();
      const note = await prisma.note.update({
        where,
        // delete draftBlobPointer if it exists
        data: { ...data, blobPointer: blobCuid, draftBlobPointer: null },
        include: { user: true },
      });

      if (!note) {
        throw new Error('Note not found');
      }

      // Upload blob
      const blobName = `${note.id}/${blobCuid}.md`;
      await this.blobsService.uploadBlob(this.blobContainerName, blobName, 'text/markdown', body);

      // update elasticsearch document
      const esBody = { ...note, body: body };
      const esResponse = await this.esService.create(this.esIndex, note.id, esBody);

      // if elasticsearch document update failed, delete blob and throw error
      if (esResponse.result === 'created' || esResponse.result === 'updated') {
        return prisma.note.findUnique({ where: { id: note.id }, include });
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
    where: Prisma.NoteWhereUniqueInput;
    data: Prisma.NoteUpdateInput;
    body: string;
    include?: Prisma.NoteInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const current = await prisma.note.findUnique({ where });

      if (!current) {
        throw new Error('Note not found');
      }

      // if draftBlobPointer exists, use same blob. otherwise, create new blob
      const blobCuid = current.draftBlobPointer || cuid();
      const note = await prisma.note.update({
        where,
        data: { ...data, draftBlobPointer: blobCuid },
      });

      if (!note) {
        throw new Error('Note not found');
      }

      // Upload blob
      const blobName = `${note.id}/${blobCuid}.draft.md`;
      await this.blobsService.uploadBlob(this.blobContainerName, blobName, 'text/markdown', body);

      return prisma.note.findUnique({ where: { id: note.id }, include });
    });
  }

  // update method required to both data and body, so we need a separate method for soft delete.
  softRemove({ where }: { where: Prisma.NoteWhereUniqueInput }) {
    return prisma.$transaction(async (prisma) => {
      const note = await prisma.note.update({
        where,
        data: { status: 'DELETED' },
      });
      if (!note) {
        throw new Error('Note not found');
      }
      const esResponse = await this.esService.delete(this.esIndex, note.id);
      if (esResponse.result === 'deleted' || esResponse.result === 'not_found') {
        return note;
      } else {
        throw new Error('Failed to delete group in Elasticsearch');
      }
    });
  }

  remove({
    where,
    include = { _count: false },
  }: {
    where: Prisma.NoteWhereUniqueInput;
    include?: Prisma.NoteInclude;
  }) {
    return prisma.$transaction(async (prisma) => {
      const note = await prisma.note.delete({ where, include });
      const esResponse = await this.esService.delete(this.esIndex, note.id);
      if (esResponse.result === 'deleted' || esResponse.result === 'not_found') {
        return note;
      } else {
        throw new Error('Failed to delete group in Elasticsearch');
      }
    });
  }

  _exFindNoteUnderPermission({
    userId,
    noteId,
    include = { _count: false },
  }: {
    userId: string;
    noteId: string;
    include?: Prisma.NoteInclude;
  }) {
    return this.findFirst({
      where: {
        id: noteId,
        blobPointer: { not: null }, // only notes with blobPointer
        user: { handle: { not: null }, status: 'NORMAL' }, // only notes of existing users
        OR: [
          { userId: userId }, // user is owner
          { status: 'NORMAL', groupId: null }, // no group
          {
            status: 'NORMAL',
            group: {
              handle: { not: null },
              status: 'NORMAL',
              readNotePermission: 'ADMIN',
              members: { some: { userId: userId, role: 'ADMIN' } },
            },
          }, // readNotePermission is ADMIN and user is admin of group
          {
            status: 'NORMAL',
            group: {
              handle: { not: null },
              status: 'NORMAL',
              readNotePermission: 'MEMBER',
              members: { some: { userId: userId, role: { in: ['ADMIN', 'MEMBER'] } } },
            },
          }, // readNotePermission is MEMBER and user is member of group
          {
            status: 'NORMAL',
            group: { handle: { not: null }, status: 'NORMAL', readNotePermission: 'ALL' },
          }, // readNotePermission is ALL
        ],
      },
      include: include,
    });
  }
}
