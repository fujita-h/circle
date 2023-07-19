import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { ConfigModule } from '@nestjs/config';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { Prisma } from '@prisma/client';
import { CreateGroupDto } from '../groups/dto/create-group.dto';
import { CreateGroupNoteDto } from '../groups/dto/create-group-note.dto';
import { GroupsController } from '../groups/groups.controller';
import { CreateNoteDto } from './dto/create-note.dto';
import { CommentsService } from '../comments/comments.service';
import { MembershipsService } from '../memberships/memberships.service';

describe('NotesController', () => {
  let controller: NotesController;
  let groupsController: GroupsController;
  let usersService: UsersService;
  let groupsService: GroupsService;
  let notesService: NotesService;
  let commentsService: CommentsService;

  class CreateGroupDtoForTest extends CreateGroupDto {
    id: string;
  }

  const testPrefix = 'x-itm-ctl-';
  const testUser1: Prisma.UserCreateInput = {
    id: testPrefix + 'u1-0123-456789',
    oid: testPrefix + 'u1-oid',
    handle: testPrefix + 'u1-handle',
    name: testPrefix + 'u1-name',
  };
  const testGroup1: CreateGroupDtoForTest = {
    id: testPrefix + 'g1-0123-456789',
    handle: testPrefix + 'g1-handle',
    name: testPrefix + 'g1-name',
    writeNoteCondition: 'ALLOWED',
    joinGroupCondition: 'ALLOWED',
  };
  const testNote1: CreateNoteDto = {
    title: testPrefix + 'i1-title',
    body: testPrefix + 'i1-body',
    status: 'NORMAL',
    group: { id: testGroup1.id },
    writeCommentPermission: 'ALL',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController, GroupsController],
      providers: [
        NotesService,
        AzblobService,
        EsService,
        UsersService,
        GroupsService,
        CommentsService,
        MembershipsService,
      ],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    groupsController = module.get<GroupsController>(GroupsController);
    usersService = module.get<UsersService>(UsersService);
    groupsService = module.get<GroupsService>(GroupsService);
    notesService = module.get<NotesService>(NotesService);

    // delete test notes
    await notesService
      .findMany({
        where: {
          OR: [{ groupId: { startsWith: testPrefix } }, { userId: { startsWith: testPrefix } }],
        },
      })
      .then(async (results) => {
        if (results && results.length > 0) {
          for (const result of results) {
            await notesService.remove({ where: { id: result.id } });
          }
        }
      });

    // delete test users
    await usersService
      .findMany({
        where: {
          OR: [
            { id: { startsWith: testPrefix } },
            { oid: { startsWith: testPrefix } },
            { handle: { startsWith: testPrefix } },
          ],
        },
      })
      .then(async (results) => {
        if (results && results.length > 0) {
          for (const result of results) {
            await usersService.remove({ where: { id: result.id } });
          }
        }
      });

    // delete test groups
    await groupsService
      .findMany({
        where: {
          OR: [
            { id: { startsWith: testPrefix } },
            { handle: { startsWith: testPrefix } },
            { name: { startsWith: testPrefix } },
          ],
        },
      })
      .then(async (results) => {
        if (results && results.length > 0) {
          for (const result of results) {
            await groupsService.remove({ where: { id: result.id } });
          }
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

  it('User1がGroup1を作成', async () => {
    const req = { user: { id: testUser1.id } };
    const result = groupsController.create(req, testGroup1);
    await expect(result).resolves.toHaveProperty('id', testGroup1.id);
    await expect(result).resolves.toHaveProperty('name', testGroup1.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
  });

  it('Group1に対してUser1でNote1を作成', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.create(req, testNote1);
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('title', testNote1.title);
    await expect(result).resolves.toHaveProperty('status', testNote1.status);
  });

  it('Group1に対してUser1でNotesを取得', async () => {
    const req = { user: { id: testUser1.id } };
    const result = groupsController.findNotes(req, testGroup1.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('noteを取得', async () => {
    const req = { user: { id: testUser1.id } };
    const pre = await groupsController.findNotes(req, testGroup1.id);
    const result = controller.findOne(req, pre[0].id);
    await expect(result).resolves.toHaveProperty('id', pre[0].id);
    await expect(result).resolves.toHaveProperty('title', testNote1.title);
  });

  it('noteを更新', async () => {
    const req = { user: { id: testUser1.id } };
    const pre = await groupsController.findNotes(req, testGroup1.id);
    const result = controller.update(req, pre[0].id, {
      ...testNote1,
      title: 'updated-title',
      body: 'updated-body',
      group: { id: testGroup1.id },
    });
    await expect(result).resolves.toHaveProperty('id', pre[0].id);
    await expect(result).resolves.toHaveProperty('title', 'updated-title');
  });

  it('noteを削除', async () => {
    const req = { user: { id: testUser1.id } };
    const pre = await groupsController.findNotes(req, testGroup1.id);
    const result = controller.remove(req, pre[0].id);
    await expect(result).resolves.toHaveProperty('id', pre[0].id);
    await expect(result).resolves.toHaveProperty('title', 'updated-title');
  });

  it('検索', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.search(req, '', 0, 20);
    await expect(result).resolves.toBeDefined();
  });
});
