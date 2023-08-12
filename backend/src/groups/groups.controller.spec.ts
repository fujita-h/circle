import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { NotesService } from '../notes/notes.service';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';
import { UsersService } from '../users/users.service';
import { NotesController } from '../notes/notes.controller';
import { CreateNoteDto } from 'src/notes/dto/create-note.dto';
import { CommentsService } from '../comments/comments.service';
import { MembershipsService } from '../memberships/memberships.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { RedisService } from '../redis.service';

const testPrefix = 'x-test-groups-controller-';
const testingModule = {
  controllers: [GroupsController, NotesController],
  providers: [
    GroupsService,
    PrismaService,
    UsersService,
    NotesService,
    CommentsService,
    AzblobService,
    EsService,
    MembershipsService,
    RedisService,
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
      for (const result of results[0]) {
        await usersService.remove({ where: { id: result.id } });
      }
    });
};
const deleteTestGroups = async (groupsService: GroupsService) => {
  await groupsService
    .findMany({ where: { handle: { startsWith: testPrefix } } })
    .then(async (results) => {
      for (const result of results[0]) {
        await groupsService.remove({ where: { id: result.id } });
      }
    });
};
const deleteTestNotes = async (notesService: NotesService) => {
  await notesService
    .findMany({
      where: {
        OR: [
          { Group: { handle: { startsWith: testPrefix } } },
          { User: { handle: { startsWith: testPrefix } } },
        ],
      },
    })
    .then(async (results) => {
      for (const result of results[0]) {
        await notesService.remove({ where: { id: result.id } });
      }
    });
};
const User = (handle: string, name: string): CreateUserDto => ({
  oid: testPrefix + handle,
  handle: testPrefix + handle,
  name: testPrefix + name,
});
const Group = (
  handle: string,
  name: string,
  rp?: 'ADMIN' | 'MEMBER' | 'ALL',
  wp?: 'ADMIN' | 'MEMBER' | 'ALL',
  wc?: 'REQUIRE_ADMIN_APPROVAL' | 'ALLOWED',
  jc?: 'DENIED' | 'REQUIRE_ADMIN_APPROVAL' | 'ALLOWED',
): CreateGroupDto => ({
  handle: testPrefix + handle,
  name: testPrefix + name,
  readNotePermission: rp,
  writeNotePermission: wp,
  writeNoteCondition: wc,
  joinGroupCondition: jc,
});

describe('GroupsController/Template', () => {
  let controller: GroupsController;
  let usersService: UsersService;
  let groupsService: GroupsService;
  let notesService: NotesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule(testingModule).compile();
    controller = module.get<GroupsController>(GroupsController);
    usersService = module.get<UsersService>(UsersService);
    groupsService = module.get<GroupsService>(GroupsService);
    notesService = module.get<NotesService>(NotesService);

    await deleteTestNotes(notesService);
    await deleteTestGroups(groupsService);
    await deleteTestUsers(usersService);
  });

  afterAll(async () => {
    await deleteTestNotes(notesService);
    await deleteTestGroups(groupsService);
    await deleteTestUsers(usersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

describe('GroupsController/Base', () => {
  let controller: GroupsController;
  let usersService: UsersService;
  let groupsService: GroupsService;
  let notesService: NotesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule(testingModule).compile();
    controller = module.get<GroupsController>(GroupsController);
    usersService = module.get<UsersService>(UsersService);
    groupsService = module.get<GroupsService>(GroupsService);
    notesService = module.get<NotesService>(NotesService);

    await deleteTestNotes(notesService);
    await deleteTestGroups(groupsService);
    await deleteTestUsers(usersService);
  });

  afterAll(async () => {
    await deleteTestNotes(notesService);
    await deleteTestGroups(groupsService);
    await deleteTestUsers(usersService);
  });

  const testUser1 = User('u1', 'u1');
  const testUser2 = User('u2', 'u2');
  const testGroup1 = Group('c1', 'c1');
  const testGroup2 = Group('c2', 'c2');

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

  let group1: any;
  it('User1がGroup1を作成', async () => {
    const req = { user: { id: user1.id } };
    const result = controller.create(req, testGroup1);
    group1 = await result;
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
    await expect(result).resolves.toHaveProperty('status', 'NORMAL');
    await expect(result).resolves.toHaveProperty('name', testGroup1.name);
  });

  it('Group1をidから取得', async () => {
    const result = controller.findOne(group1.id);
    await expect(result).resolves.toHaveProperty('id', group1.id);
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
    await expect(result).resolves.toHaveProperty('name', testGroup1.name);
  });

  it('Group1をhandleから取得', async () => {
    const req = { user: { id: user1.id } };
    const result = controller.findOneByHandle(req, group1.handle);
    await expect(result).resolves.toHaveProperty('id', group1.id);
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
    await expect(result).resolves.toHaveProperty('name', testGroup1.name);
  });

  let group2: any;
  it('User2がGroup2を作成', async () => {
    const req = { user: { id: user2.id } };
    const result = controller.create(req, testGroup2);
    group2 = await result;
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('handle', testGroup2.handle);
    await expect(result).resolves.toHaveProperty('status', 'NORMAL');
    await expect(result).resolves.toHaveProperty('name', testGroup2.name);
  });

  it('Group2をidから取得', async () => {
    const result = controller.findOne(group2.id);
    await expect(result).resolves.toHaveProperty('id', group2.id);
    await expect(result).resolves.toHaveProperty('handle', testGroup2.handle);
    await expect(result).resolves.toHaveProperty('name', testGroup2.name);
  });

  it('Group2をhandleから取得', async () => {
    const req = { user: { id: user1.id } };
    const result = controller.findOneByHandle(req, group2.handle);
    await expect(result).resolves.toHaveProperty('id', group2.id);
    await expect(result).resolves.toHaveProperty('handle', testGroup2.handle);
    await expect(result).resolves.toHaveProperty('name', testGroup2.name);
  });

  it('Group一覧を取得', async () => {
    const result = await controller.findMany();
    await expect(result.data.length).toBeGreaterThanOrEqual(2);
  });

  it('User1がGroup1を更新', async () => {
    const req = { user: { id: user1.id } };
    const result = controller.update(req, group1.id, { name: 'updated' });
    await expect(result).resolves.toHaveProperty('id', group1.id);
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
    await expect(result).resolves.toHaveProperty('name', 'updated');
  });

  it('User1がGroup1を削除', async () => {
    const req = { user: { id: user1.id } };
    const result = controller.remove(req, group1.id);
    await expect(result).resolves.toHaveProperty('id', group1.id);
    await expect(result).resolves.toHaveProperty('handle', null);
    await expect(result).resolves.toHaveProperty('status', 'DELETED');
    await expect(result).resolves.toHaveProperty('name', 'updated');
  });

  it('User1がGroup2を更新', async () => {
    const req = { user: { id: user1.id } };
    const result = controller.update(req, group2.id, { name: 'updated' });
    await expect(result).rejects.toThrow();
  });

  it('User1がGroup2を削除', async () => {
    const req = { user: { id: user1.id } };
    const result = controller.remove(req, group2.id);
    await expect(result).rejects.toThrow();
  });
});
