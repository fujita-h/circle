import { Test, TestingModule } from '@nestjs/testing';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { ConfigModule } from '@nestjs/config';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { Prisma } from '@prisma/client';
import { CreateGroupDto } from '../groups/dto/create-group.dto';
import { CreateGroupItemDto } from '../groups/dto/create-group-item.dto';
import { GroupsController } from '../groups/groups.controller';
import { CreateItemDto } from './dto/create-item.dto';
import { CommentsService } from '../comments/comments.service';

describe('ItemsController', () => {
  let controller: ItemsController;
  let groupsController: GroupsController;
  let usersService: UsersService;
  let groupsService: GroupsService;
  let itemsService: ItemsService;
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
    type: 'OPEN',
  };
  const testItem1: CreateItemDto = {
    title: testPrefix + 'i1-title',
    body: testPrefix + 'i1-body',
    status: 'NORMAL',
    group: { id: testGroup1.id },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemsController, GroupsController],
      providers: [
        ItemsService,
        AzblobService,
        EsService,
        UsersService,
        GroupsService,
        CommentsService,
      ],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    controller = module.get<ItemsController>(ItemsController);
    groupsController = module.get<GroupsController>(GroupsController);
    usersService = module.get<UsersService>(UsersService);
    groupsService = module.get<GroupsService>(GroupsService);
    itemsService = module.get<ItemsService>(ItemsService);

    // delete test item1 if exists
    await itemsService
      .findMany({ where: { group: { id: testGroup1.id } } })
      .then(async (results) => {
        if (results && results.length > 0) {
          for (const result of results) {
            await itemsService.remove({ where: { id: result.id } });
          }
        }
      });
    // delete test user1 if exists
    await usersService.findOne({ where: { id: testUser1.id } }).then(async (result) => {
      if (result && result.id) {
        await usersService.remove({ where: { id: result.id } });
      }
    });
    // delete test group1 if exists
    await groupsService.findOne({ where: { id: testGroup1.id } }).then(async (result) => {
      if (result && result.id) {
        await groupsService.remove({ where: { id: result.id } });
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
    await expect(result).resolves.toHaveProperty('type', testGroup1.type);
  });

  it('Group1に対してUser1でItem1を作成', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.create(req, testItem1);
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('title', testItem1.title);
    await expect(result).resolves.toHaveProperty('status', testItem1.status);
  });

  it('Group1に対してUser1でItemsを取得', async () => {
    const req = { user: { id: testUser1.id } };
    const result = groupsController.findItems(req, testGroup1.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('itemを取得', async () => {
    const req = { user: { id: testUser1.id } };
    const pre = await groupsController.findItems(req, testGroup1.id);
    const result = controller.findOne(req, pre[0].id);
    await expect(result).resolves.toHaveProperty('id', pre[0].id);
    await expect(result).resolves.toHaveProperty('title', testItem1.title);
  });

  it('itemを更新', async () => {
    const req = { user: { id: testUser1.id } };
    const pre = await groupsController.findItems(req, testGroup1.id);
    const result = controller.update(req, pre[0].id, {
      ...testItem1,
      title: 'updated-title',
      body: 'updated-body',
      group: { id: testGroup1.id },
    });
    await expect(result).resolves.toHaveProperty('id', pre[0].id);
    await expect(result).resolves.toHaveProperty('title', 'updated-title');
  });

  it('itemを削除', async () => {
    const req = { user: { id: testUser1.id } };
    const pre = await groupsController.findItems(req, testGroup1.id);
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
