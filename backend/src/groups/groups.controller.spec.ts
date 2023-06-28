import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { ConfigModule } from '@nestjs/config';
import { CreateGroupDto } from './dto/create-group.dto';
import { ItemsService } from '../items/items.service';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';
import { UsersService } from '../users/users.service';
import { Prisma } from '@prisma/client';
import { CreateGroupItemDto } from './dto/create-group-item.dto';
import { ItemsController } from '../items/items.controller';
import { CreateItemDto } from 'src/items/dto/create-item.dto';
import { CommentsService } from '../comments/comments.service';

describe('GroupsController', () => {
  let controller: GroupsController;
  let itemsController: ItemsController;
  let usersService: UsersService;
  let groupsService: GroupsService;
  let itemsService: ItemsService;

  class CreateGroupDtoForTest extends CreateGroupDto {
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
  const testGroup1: CreateGroupDtoForTest = {
    id: testPrefix + 'g1-0123-456789',
    handle: testPrefix + 'g1-handle',
    name: testPrefix + 'g1-name',
    type: 'OPEN',
  };
  const testGroup2: CreateGroupDtoForTest = {
    id: testPrefix + 'g2-0123-456789',
    handle: testPrefix + 'g2-handle',
    name: testPrefix + 'g2-name',
    type: 'PUBLIC',
  };
  const testGroup3: CreateGroupDtoForTest = {
    id: testPrefix + 'g3-0123-456789',
    handle: testPrefix + 'g3-handle',
    name: testPrefix + 'g3-name',
    type: 'PRIVATE',
  };
  const testItem1: CreateItemDto = {
    title: testPrefix + 'i1-title',
    body: testPrefix + 'i1-body',
    status: 'NORMAL',
    group: { id: testGroup1.id },
  };
  const testItem2: CreateItemDto = {
    title: testPrefix + 'i2-title',
    body: testPrefix + 'i2-body',
    status: 'NORMAL',
    group: { id: testGroup2.id },
  };
  const testItem3: CreateItemDto = {
    title: testPrefix + 'i3-title',
    body: testPrefix + 'i3-body',
    status: 'NORMAL',
    group: { id: testGroup3.id },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController, ItemsController],
      providers: [
        GroupsService,
        UsersService,
        ItemsService,
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

    controller = module.get<GroupsController>(GroupsController);
    itemsController = module.get<ItemsController>(ItemsController);
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

    // delete test item2 if exists
    await itemsService
      .findMany({ where: { group: { id: testGroup2.id } } })
      .then(async (results) => {
        if (results && results.length > 0) {
          for (const result of results) {
            await itemsService.remove({ where: { id: result.id } });
          }
        }
      });

    // delete test item3 if exists
    await itemsService
      .findMany({ where: { group: { id: testGroup3.id } } })
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

    // delete test group1 if exists
    await groupsService.findOne({ where: { id: testGroup1.id } }).then(async (result) => {
      if (result && result.id) {
        await groupsService.remove({ where: { id: result.id } });
      }
    });

    // delete test group2 if exists
    await groupsService.findOne({ where: { id: testGroup2.id } }).then(async (result) => {
      if (result && result.id) {
        await groupsService.remove({ where: { id: result.id } });
      }
    });

    // delete test group3 if exists
    await groupsService.findOne({ where: { id: testGroup3.id } }).then(async (result) => {
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

  it('User1がGroup1を作成', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.create(req, testGroup1);
    await expect(result).resolves.toHaveProperty('id', testGroup1.id);
    await expect(result).resolves.toHaveProperty('name', testGroup1.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
    await expect(result).resolves.toHaveProperty('type', testGroup1.type);
  });

  it('User2がGroup2を作成', async () => {
    const req = { user: { id: testUser2.id } };
    const result = controller.create(req, testGroup2);
    await expect(result).resolves.toHaveProperty('id', testGroup2.id);
    await expect(result).resolves.toHaveProperty('name', testGroup2.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup2.handle);
    await expect(result).resolves.toHaveProperty('type', testGroup2.type);
  });

  it('User3がGroup3を作成', async () => {
    const req = { user: { id: testUser3.id } };
    const result = controller.create(req, testGroup3);
    await expect(result).resolves.toHaveProperty('id', testGroup3.id);
    await expect(result).resolves.toHaveProperty('name', testGroup3.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup3.handle);
    await expect(result).resolves.toHaveProperty('type', testGroup3.type);
  });

  it('User1が再度Group1を作成 => reject', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.create(req, testGroup1);
    await expect(result).rejects.toThrow();
  });

  it('Group1をidから取得', async () => {
    const result = controller.findOne(testGroup1.id);
    await expect(result).resolves.toHaveProperty('id', testGroup1.id);
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

  it('Group1に対してUser1でItem1を作成', async () => {
    const req = { user: { id: testUser1.id } };
    const result = itemsController.create(req, testItem1);
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('title', testItem1.title);
    await expect(result).resolves.toHaveProperty('status', testItem1.status);
  });

  it('Group2に対してUser2でItem2を作成', async () => {
    const req = { user: { id: testUser2.id } };
    const result = itemsController.create(req, testItem2);
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('title', testItem2.title);
    await expect(result).resolves.toHaveProperty('status', testItem2.status);
  });

  it('Group3に対してUser3でItem3を作成', async () => {
    const req = { user: { id: testUser3.id } };
    const result = itemsController.create(req, testItem3);
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('title', testItem3.title);
    await expect(result).resolves.toHaveProperty('status', testItem3.status);
  });

  it('Group2に対してUser1でItem2を作成 => reject', async () => {
    const req = { user: { id: testUser1.id } };
    const result = itemsController.create(req, testItem2);
    await expect(result).rejects.toThrow();
  });

  it('Group1に対してUser1でItemsを取得', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.findItems(req, testGroup1.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('Group1に対してUser2でItemsを取得', async () => {
    const req = { user: { id: testUser2.id } };
    const result = controller.findItems(req, testGroup1.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('Group1に対してUser3でItemsを取得', async () => {
    const req = { user: { id: testUser3.id } };
    const result = controller.findItems(req, testGroup1.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('Group2に対してUser1でItemsを取得', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.findItems(req, testGroup2.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('Group2に対してUser2でItemsを取得', async () => {
    const req = { user: { id: testUser2.id } };
    const result = controller.findItems(req, testGroup2.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('Group2に対してUser3でItemsを取得', async () => {
    const req = { user: { id: testUser3.id } };
    const result = controller.findItems(req, testGroup2.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('Group3に対してUser1でItemsを取得', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.findItems(req, testGroup3.id);
    await expect(result).resolves.toHaveLength(0);
  });

  it('Group3に対してUser2でItemsを取得', async () => {
    const req = { user: { id: testUser2.id } };
    const result = controller.findItems(req, testGroup3.id);
    await expect(result).resolves.toHaveLength(0);
  });

  it('Group3に対してUser3でItemsを取得', async () => {
    const req = { user: { id: testUser3.id } };
    const result = controller.findItems(req, testGroup3.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('Group1を削除(Soft Delete)', async () => {
    const result = controller.remove(testGroup1.id);
    await expect(result).resolves.toHaveProperty('id', testGroup1.id);
    await expect(result).resolves.toHaveProperty('name', testGroup1.name);
    await expect(result).resolves.toHaveProperty('handle', null);
  });

  it('Group1が取得できないことを確認', async () => {
    const result = controller.findOne(testGroup1.id);
    await expect(result).resolves.toBeNull();
  });
});
