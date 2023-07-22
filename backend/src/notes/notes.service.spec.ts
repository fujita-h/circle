import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';

describe('NotesService', () => {
  let usersService: UsersService;
  let groupsService: GroupsService;
  let noteService: NotesService;

  const testPrefix = 'x-itm-svc-';
  const testUser: Prisma.UserCreateInput = {
    id: testPrefix + 'u-0123-456789',
    oid: testPrefix + 'u-oid',
    handle: testPrefix + 'u-handle',
    name: testPrefix + 'u-name',
  };
  const testGroup: Prisma.GroupCreateInput = {
    id: testPrefix + 'g-0123-456789',
    handle: testPrefix + 'g-handle',
    name: testPrefix + 'g-name',
  };
  const testNote: Prisma.NoteCreateInput = {
    id: testPrefix + 'i-0123-456789',
    User: { connect: { id: testUser.id } },
    Group: { connect: { id: testGroup.id } },
    title: testPrefix + 'i-title',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        ConfigService,
        UsersService,
        GroupsService,
        AzblobService,
        EsService,
      ],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    groupsService = module.get<GroupsService>(GroupsService);
    noteService = module.get<NotesService>(NotesService);

    // delete test notes if exists
    await noteService.findOne({ where: { id: testNote.id } }).then(async (result) => {
      if (result && result.id) {
        await noteService.remove({ where: { id: result.id } });
      }
    });
    await usersService.findOne({ where: { id: testUser.id } }).then(async (result) => {
      if (result && result.id) {
        await usersService.remove({ where: { id: result.id } });
      }
    });
    await groupsService.findOne({ where: { id: testGroup.id } }).then(async (result) => {
      if (result && result.id) {
        await groupsService.remove({ where: { id: result.id } });
      }
    });
  });

  beforeEach(async () => {
    //
  });

  it('should be defined', () => {
    expect(noteService).toBeDefined();
  });

  it('Userの作成', async () => {
    const result = usersService.create({ data: testUser });
    await expect(result).resolves.toHaveProperty('id', testUser.id);
    await expect(result).resolves.toHaveProperty('name', testUser.name);
    await expect(result).resolves.toHaveProperty('handle', testUser.handle);
  });

  it('Groupの作成', async () => {
    const result = groupsService.create({ data: testGroup });
    await expect(result).resolves.toHaveProperty('id', testGroup.id);
    await expect(result).resolves.toHaveProperty('name', testGroup.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup.handle);
  });

  it('Noteの作成', async () => {
    const result = noteService.create({ data: testNote, body: 'body-' + Date() });
    await expect(result).resolves.toHaveProperty('id', testNote.id);
    await expect(result).resolves.toHaveProperty('title', testNote.title);
  });

  it('Noteの更新', async () => {
    const result = noteService.update({
      where: { id: testNote.id },
      data: { ...testNote, title: 'new title' },
      body: 'body-' + Date(),
    });
    await expect(result).resolves.toHaveProperty('id', testNote.id);
    await expect(result).resolves.toHaveProperty('title', 'new title');
  });

  it('Note一覧取得', async () => {
    const result = await noteService.findMany({ where: { Group: { id: testGroup.id } } });
    await expect(result[0].length).toBeGreaterThan(0);
    await expect(result[0][0]).toHaveProperty('id', testNote.id);
  });

  it('Note取得', async () => {
    const result = await noteService.findOne({ where: { id: testNote.id } });
    await expect(result).toHaveProperty('id', testNote.id);
  });

  it('Note削除', async () => {
    const result = await noteService.remove({ where: { id: testNote.id } });
    await expect(result).toHaveProperty('id', testNote.id);
  });
});
