import { Test, TestingModule } from '@nestjs/testing';
import { CirclesController } from './circles.controller';
import { CirclesService } from './circles.service';
import { ConfigModule } from '@nestjs/config';
import { CreateCircleDto } from './dto/create-circle.dto';
import { NotesService } from '../notes/notes.service';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';
import { UsersService } from '../users/users.service';
import { Prisma } from '@prisma/client';
import { NotesController } from '../notes/notes.controller';
import { CreateNoteDto } from 'src/notes/dto/create-note.dto';
import { CommentsService } from '../comments/comments.service';

describe('CirclesController', () => {
  let controller: CirclesController;
  let notesController: NotesController;
  let usersService: UsersService;
  let circlesService: CirclesService;
  let notesService: NotesService;

  class CreateCircleDtoForTest extends CreateCircleDto {
    id: string;
  }

  const testPrefix = 'x-grp-ctl-';
  const testUser1: Prisma.UserCreateInput = {
    id: testPrefix + 'u1-0123-456789',
    oid: testPrefix + 'u1-oid',
    handle: testPrefix + 'u1-handle',
    name: testPrefix + 'u1-name',
  };
  const testUser2: Prisma.UserCreateInput = {
    id: testPrefix + 'u2-0123-456789',
    oid: testPrefix + 'u2-oid',
    handle: testPrefix + 'u2-handle',
    name: testPrefix + 'u2-name',
  };
  const testUser3: Prisma.UserCreateInput = {
    id: testPrefix + 'u3-0123-456789',
    oid: testPrefix + 'u3-oid',
    handle: testPrefix + 'u3-handle',
    name: testPrefix + 'u3-name',
  };
  const testCircle1: CreateCircleDtoForTest = {
    id: testPrefix + 'g1-0123-456789',
    handle: testPrefix + 'g1-handle',
    name: testPrefix + 'g1-name',
    type: 'OPEN',
  };
  const testCircle2: CreateCircleDtoForTest = {
    id: testPrefix + 'g2-0123-456789',
    handle: testPrefix + 'g2-handle',
    name: testPrefix + 'g2-name',
    type: 'PUBLIC',
  };
  const testCircle3: CreateCircleDtoForTest = {
    id: testPrefix + 'g3-0123-456789',
    handle: testPrefix + 'g3-handle',
    name: testPrefix + 'g3-name',
    type: 'PRIVATE',
  };
  const testNote1: CreateNoteDto = {
    title: testPrefix + 'i1-title',
    body: testPrefix + 'i1-body',
    status: 'NORMAL',
    circle: { id: testCircle1.id },
  };
  const testNote2: CreateNoteDto = {
    title: testPrefix + 'i2-title',
    body: testPrefix + 'i2-body',
    status: 'NORMAL',
    circle: { id: testCircle2.id },
  };
  const testNote3: CreateNoteDto = {
    title: testPrefix + 'i3-title',
    body: testPrefix + 'i3-body',
    status: 'NORMAL',
    circle: { id: testCircle3.id },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CirclesController, NotesController],
      providers: [
        CirclesService,
        UsersService,
        NotesService,
        CommentsService,
        AzblobService,
        EsService,
      ],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    controller = module.get<CirclesController>(CirclesController);
    notesController = module.get<NotesController>(NotesController);
    usersService = module.get<UsersService>(UsersService);
    circlesService = module.get<CirclesService>(CirclesService);
    notesService = module.get<NotesService>(NotesService);

    // delete test note1 if exists
    await notesService
      .findMany({ where: { circle: { id: testCircle1.id } } })
      .then(async (results) => {
        if (results && results.length > 0) {
          for (const result of results) {
            await notesService.remove({ where: { id: result.id } });
          }
        }
      });

    // delete test note2 if exists
    await notesService
      .findMany({ where: { circle: { id: testCircle2.id } } })
      .then(async (results) => {
        if (results && results.length > 0) {
          for (const result of results) {
            await notesService.remove({ where: { id: result.id } });
          }
        }
      });

    // delete test note3 if exists
    await notesService
      .findMany({ where: { circle: { id: testCircle3.id } } })
      .then(async (results) => {
        if (results && results.length > 0) {
          for (const result of results) {
            await notesService.remove({ where: { id: result.id } });
          }
        }
      });

    // delete test user1 if exists
    await usersService.findOne({ where: { id: testUser1.id } }).then(async (result) => {
      if (result && result.id) {
        await usersService.remove({ where: { id: result.id } });
      }
    });

    // delete test user2 if exists
    await usersService.findOne({ where: { id: testUser2.id } }).then(async (result) => {
      if (result && result.id) {
        await usersService.remove({ where: { id: result.id } });
      }
    });

    // delete test user3 if exists
    await usersService.findOne({ where: { id: testUser3.id } }).then(async (result) => {
      if (result && result.id) {
        await usersService.remove({ where: { id: result.id } });
      }
    });

    // delete test circle1 if exists
    await circlesService.findOne({ where: { id: testCircle1.id } }).then(async (result) => {
      if (result && result.id) {
        await circlesService.remove({ where: { id: result.id } });
      }
    });

    // delete test circle2 if exists
    await circlesService.findOne({ where: { id: testCircle2.id } }).then(async (result) => {
      if (result && result.id) {
        await circlesService.remove({ where: { id: result.id } });
      }
    });

    // delete test circle3 if exists
    await circlesService.findOne({ where: { id: testCircle3.id } }).then(async (result) => {
      if (result && result.id) {
        await circlesService.remove({ where: { id: result.id } });
      }
    });
  });

  beforeEach(async () => {
    //
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('User1を作成', async () => {
    const result = usersService.create({ data: testUser1 });
    await expect(result).resolves.toHaveProperty('id', testUser1.id);
    await expect(result).resolves.toHaveProperty('name', testUser1.name);
    await expect(result).resolves.toHaveProperty('handle', testUser1.handle);
  });

  it('User2を作成', async () => {
    const result = usersService.create({ data: testUser2 });
    await expect(result).resolves.toHaveProperty('id', testUser2.id);
    await expect(result).resolves.toHaveProperty('name', testUser2.name);
    await expect(result).resolves.toHaveProperty('handle', testUser2.handle);
  });

  it('User3を作成', async () => {
    const result = usersService.create({ data: testUser3 });
    await expect(result).resolves.toHaveProperty('id', testUser3.id);
    await expect(result).resolves.toHaveProperty('name', testUser3.name);
    await expect(result).resolves.toHaveProperty('handle', testUser3.handle);
  });

  it('User1がCircle1を作成', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.create(req, testCircle1);
    await expect(result).resolves.toHaveProperty('id', testCircle1.id);
    await expect(result).resolves.toHaveProperty('name', testCircle1.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
    await expect(result).resolves.toHaveProperty('type', testCircle1.type);
  });

  it('User2がCircle2を作成', async () => {
    const req = { user: { id: testUser2.id } };
    const result = controller.create(req, testCircle2);
    await expect(result).resolves.toHaveProperty('id', testCircle2.id);
    await expect(result).resolves.toHaveProperty('name', testCircle2.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle2.handle);
    await expect(result).resolves.toHaveProperty('type', testCircle2.type);
  });

  it('User3がCircle3を作成', async () => {
    const req = { user: { id: testUser3.id } };
    const result = controller.create(req, testCircle3);
    await expect(result).resolves.toHaveProperty('id', testCircle3.id);
    await expect(result).resolves.toHaveProperty('name', testCircle3.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle3.handle);
    await expect(result).resolves.toHaveProperty('type', testCircle3.type);
  });

  it('User1が再度Circle1を作成 => reject', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.create(req, testCircle1);
    await expect(result).rejects.toThrow();
  });

  it('Circle1をidから取得', async () => {
    const result = controller.findOne(testCircle1.id);
    await expect(result).resolves.toHaveProperty('id', testCircle1.id);
  });

  it('グループ一覧の取得', async () => {
    const take = 2;
    let skip = 0;
    let end = false;
    while (!end) {
      const result = await controller.findMany(take, skip);
      expect(result.length).toBeLessThanOrEqual(take);
      skip += take;
      end = result.length < take;
    }
  });

  it('Circle1に対してUser1でNote1を作成', async () => {
    const req = { user: { id: testUser1.id } };
    const result = notesController.create(req, testNote1);
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('title', testNote1.title);
    await expect(result).resolves.toHaveProperty('status', testNote1.status);
  });

  it('Circle2に対してUser2でNote2を作成', async () => {
    const req = { user: { id: testUser2.id } };
    const result = notesController.create(req, testNote2);
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('title', testNote2.title);
    await expect(result).resolves.toHaveProperty('status', testNote2.status);
  });

  it('Circle3に対してUser3でNote3を作成', async () => {
    const req = { user: { id: testUser3.id } };
    const result = notesController.create(req, testNote3);
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('title', testNote3.title);
    await expect(result).resolves.toHaveProperty('status', testNote3.status);
  });

  it('Circle2に対してUser1でNote2を作成 => reject', async () => {
    const req = { user: { id: testUser1.id } };
    const result = notesController.create(req, testNote2);
    await expect(result).rejects.toThrow();
  });

  it('Circle1に対してUser1でNotesを取得', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.findNotes(req, testCircle1.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('Circle1に対してUser2でNotesを取得', async () => {
    const req = { user: { id: testUser2.id } };
    const result = controller.findNotes(req, testCircle1.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('Circle1に対してUser3でNotesを取得', async () => {
    const req = { user: { id: testUser3.id } };
    const result = controller.findNotes(req, testCircle1.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('Circle2に対してUser1でNotesを取得', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.findNotes(req, testCircle2.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('Circle2に対してUser2でNotesを取得', async () => {
    const req = { user: { id: testUser2.id } };
    const result = controller.findNotes(req, testCircle2.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('Circle2に対してUser3でNotesを取得', async () => {
    const req = { user: { id: testUser3.id } };
    const result = controller.findNotes(req, testCircle2.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('Circle3に対してUser1でNotesを取得', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.findNotes(req, testCircle3.id);
    await expect(result).resolves.toHaveLength(0);
  });

  it('Circle3に対してUser2でNotesを取得', async () => {
    const req = { user: { id: testUser2.id } };
    const result = controller.findNotes(req, testCircle3.id);
    await expect(result).resolves.toHaveLength(0);
  });

  it('Circle3に対してUser3でNotesを取得', async () => {
    const req = { user: { id: testUser3.id } };
    const result = controller.findNotes(req, testCircle3.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('Circle1を削除(Soft Delete)', async () => {
    const result = controller.remove(testCircle1.id);
    await expect(result).resolves.toHaveProperty('id', testCircle1.id);
    await expect(result).resolves.toHaveProperty('name', testCircle1.name);
    await expect(result).resolves.toHaveProperty('handle', null);
  });

  it('Circle1が取得できないことを確認', async () => {
    const result = controller.findOne(testCircle1.id);
    await expect(result).resolves.toBeNull();
  });
});
