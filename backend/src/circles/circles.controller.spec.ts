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
import { MembershipsService } from '../memberships/memberships.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

const testPrefix = 'x-test-circles-controller-';
const testingModule = {
  controllers: [CirclesController, NotesController],
  providers: [
    CirclesService,
    UsersService,
    NotesService,
    CommentsService,
    AzblobService,
    EsService,
    MembershipsService,
  ],
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.test'],
    }),
  ],
};
const deleteTestUsers = async (usersService: UsersService) => {
  await usersService
    .findMany({ where: { handle: { startsWith: testPrefix } } })
    .then(async (results) => {
      for (const result of results) {
        await usersService.remove({ where: { id: result.id } });
      }
    });
};
const deleteTestCircles = async (circlesService: CirclesService) => {
  await circlesService
    .findMany({ where: { handle: { startsWith: testPrefix } } })
    .then(async (results) => {
      for (const result of results) {
        await circlesService.remove({ where: { id: result.id } });
      }
    });
};
const deleteTestNotes = async (notesService: NotesService) => {
  await notesService
    .findMany({
      where: {
        OR: [
          { circle: { handle: { startsWith: testPrefix } } },
          { user: { handle: { startsWith: testPrefix } } },
        ],
      },
    })
    .then(async (results) => {
      for (const result of results) {
        await notesService.remove({ where: { id: result.id } });
      }
    });
};
const User = (handle: string, name: string): CreateUserDto => ({
  oid: testPrefix + handle,
  handle: testPrefix + handle,
  name: testPrefix + name,
});
const Circle = (
  handle: string,
  name: string,
  rp?: 'ADMIN' | 'MEMBER' | 'ALL',
  wp?: 'ADMIN' | 'MEMBER' | 'ALL',
  wc?: 'REQUIRE_ADMIN_APPROVAL' | 'ALLOWED',
  jc?: 'REQUIRE_ADMIN_APPROVAL' | 'ALLOWED',
): CreateCircleDto => ({
  handle: testPrefix + handle,
  name: testPrefix + name,
  readNotePermission: rp,
  writeNotePermission: wp,
  writeNoteCondition: wc,
  joinCircleCondition: jc,
});

describe('CirclesController/Template', () => {
  let controller: CirclesController;
  let usersService: UsersService;
  let circlesService: CirclesService;
  let notesService: NotesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule(testingModule).compile();
    controller = module.get<CirclesController>(CirclesController);
    usersService = module.get<UsersService>(UsersService);
    circlesService = module.get<CirclesService>(CirclesService);
    notesService = module.get<NotesService>(NotesService);

    await deleteTestNotes(notesService);
    await deleteTestCircles(circlesService);
    await deleteTestUsers(usersService);
  });

  afterAll(async () => {
    await deleteTestNotes(notesService);
    await deleteTestCircles(circlesService);
    await deleteTestUsers(usersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

describe('CirclesController/Base', () => {
  let controller: CirclesController;
  let usersService: UsersService;
  let circlesService: CirclesService;
  let notesService: NotesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule(testingModule).compile();
    controller = module.get<CirclesController>(CirclesController);
    usersService = module.get<UsersService>(UsersService);
    circlesService = module.get<CirclesService>(CirclesService);
    notesService = module.get<NotesService>(NotesService);

    await deleteTestNotes(notesService);
    await deleteTestCircles(circlesService);
    await deleteTestUsers(usersService);
  });

  afterAll(async () => {
    await deleteTestNotes(notesService);
    await deleteTestCircles(circlesService);
    await deleteTestUsers(usersService);
  });

  const testUser1 = User('u1', 'u1');
  const testUser2 = User('u2', 'u2');
  const testCircle1 = Circle('c1', 'c1');
  const testCircle2 = Circle('c2', 'c2');

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  let user1: any;
  it('User1を作成', async () => {
    const result = usersService.create({ data: testUser1 });
    user1 = await result;
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('handle', testUser1.handle);
    await expect(result).resolves.toHaveProperty('name', testUser1.name);
  });

  let user2: any;
  it('User2を作成', async () => {
    const result = usersService.create({ data: testUser2 });
    user2 = await result;
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('handle', testUser2.handle);
    await expect(result).resolves.toHaveProperty('name', testUser2.name);
  });

  let circle1: any;
  it('User1がCircle1を作成', async () => {
    const req = { user: { id: user1.id } };
    const result = controller.create(req, testCircle1);
    circle1 = await result;
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
    await expect(result).resolves.toHaveProperty('status', 'NORMAL');
    await expect(result).resolves.toHaveProperty('name', testCircle1.name);
  });

  it('Circle1をidから取得', async () => {
    const result = controller.findOne(circle1.id);
    await expect(result).resolves.toHaveProperty('id', circle1.id);
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
    await expect(result).resolves.toHaveProperty('name', testCircle1.name);
  });

  it('Circle1をhandleから取得', async () => {
    const result = controller.findOneByHandle(circle1.handle);
    await expect(result).resolves.toHaveProperty('id', circle1.id);
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
    await expect(result).resolves.toHaveProperty('name', testCircle1.name);
  });

  let circle2: any;
  it('User2がCircle2を作成', async () => {
    const req = { user: { id: user2.id } };
    const result = controller.create(req, testCircle2);
    circle2 = await result;
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('handle', testCircle2.handle);
    await expect(result).resolves.toHaveProperty('status', 'NORMAL');
    await expect(result).resolves.toHaveProperty('name', testCircle2.name);
  });

  it('Circle2をidから取得', async () => {
    const result = controller.findOne(circle2.id);
    await expect(result).resolves.toHaveProperty('id', circle2.id);
    await expect(result).resolves.toHaveProperty('handle', testCircle2.handle);
    await expect(result).resolves.toHaveProperty('name', testCircle2.name);
  });

  it('Circle2をhandleから取得', async () => {
    const result = controller.findOneByHandle(circle2.handle);
    await expect(result).resolves.toHaveProperty('id', circle2.id);
    await expect(result).resolves.toHaveProperty('handle', testCircle2.handle);
    await expect(result).resolves.toHaveProperty('name', testCircle2.name);
  });

  it('Circle一覧を取得', async () => {
    const result = await controller.findMany();
    await expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('User1がCircle1を更新', async () => {
    const req = { user: { id: user1.id } };
    const result = controller.update(req, circle1.id, { name: 'updated' });
    await expect(result).resolves.toHaveProperty('id', circle1.id);
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
    await expect(result).resolves.toHaveProperty('name', 'updated');
  });

  it('User1がCircle1を削除', async () => {
    const req = { user: { id: user1.id } };
    const result = controller.remove(req, circle1.id);
    await expect(result).resolves.toHaveProperty('id', circle1.id);
    await expect(result).resolves.toHaveProperty('handle', null);
    await expect(result).resolves.toHaveProperty('status', 'DELETED');
    await expect(result).resolves.toHaveProperty('name', 'updated');
  });

  it('User1がCircle2を更新', async () => {
    const req = { user: { id: user1.id } };
    const result = controller.update(req, circle2.id, { name: 'updated' });
    await expect(result).rejects.toThrow();
  });

  it('User1がCircle2を削除', async () => {
    const req = { user: { id: user1.id } };
    const result = controller.remove(req, circle2.id);
    await expect(result).rejects.toThrow();
  });
});
