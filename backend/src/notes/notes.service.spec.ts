import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { CirclesService } from '../circles/circles.service';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';

describe('NotesService', () => {
  let usersService: UsersService;
  let circlesService: CirclesService;
  let noteService: NotesService;

  const testPrefix = 'x-itm-svc-';
  const testUser: Prisma.UserCreateInput = {
    id: testPrefix + 'u-0123-456789',
    oid: testPrefix + 'u-oid',
    handle: testPrefix + 'u-handle',
    name: testPrefix + 'u-name',
  };
  const testCircle: Prisma.CircleCreateInput = {
    id: testPrefix + 'g-0123-456789',
    handle: testPrefix + 'g-handle',
    name: testPrefix + 'g-name',
  };
  const testNote: Prisma.NoteCreateInput = {
    id: testPrefix + 'i-0123-456789',
    user: { connect: { id: testUser.id } },
    circle: { connect: { id: testCircle.id } },
    title: testPrefix + 'i-title',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        ConfigService,
        UsersService,
        CirclesService,
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
    circlesService = module.get<CirclesService>(CirclesService);
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
    await circlesService.findOne({ where: { id: testCircle.id } }).then(async (result) => {
      if (result && result.id) {
        await circlesService.remove({ where: { id: result.id } });
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

  it('Circleの作成', async () => {
    const result = circlesService.create({ data: testCircle });
    await expect(result).resolves.toHaveProperty('id', testCircle.id);
    await expect(result).resolves.toHaveProperty('name', testCircle.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle.handle);
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
    const result = await noteService.findMany({ where: { circle: { id: testCircle.id } } });
    await expect(result.length).toBeGreaterThan(0);
    await expect(result[0]).toHaveProperty('id', testNote.id);
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
