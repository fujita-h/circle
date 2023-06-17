import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService } from './items.service';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';

describe('ItemsService', () => {
  let usersService: UsersService;
  let groupsService: GroupsService;
  let itemService: ItemsService;

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
  const testItem: Prisma.ItemCreateInput = {
    id: testPrefix + 'i-0123-456789',
    user: { connect: { id: testUser.id } },
    group: { connect: { id: testGroup.id } },
    title: testPrefix + 'i-title',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
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
    itemService = module.get<ItemsService>(ItemsService);

    // delete test items if exists
    await itemService.findOne({ where: { id: testItem.id } }).then(async (result) => {
      if (result && result.id) {
        await itemService.remove({ where: { id: result.id } });
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
    expect(itemService).toBeDefined();
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

  it('Itemの作成', async () => {
    const result = itemService.create({ data: testItem, body: 'body-' + Date() });
    await expect(result).resolves.toHaveProperty('id', testItem.id);
    await expect(result).resolves.toHaveProperty('title', testItem.title);
  });

  it('Itemの更新', async () => {
    const result = itemService.update({
      where: { id: testItem.id },
      data: { ...testItem, title: 'new title' },
      body: 'body-' + Date(),
    });
    await expect(result).resolves.toHaveProperty('id', testItem.id);
    await expect(result).resolves.toHaveProperty('title', 'new title');
  });

  it('Item一覧取得', async () => {
    const result = await itemService.findMany({ where: { group: { id: testGroup.id } } });
    await expect(result.length).toBeGreaterThan(0);
    await expect(result[0]).toHaveProperty('id', testItem.id);
  });

  it('Item取得', async () => {
    const result = await itemService.findOne({ where: { id: testItem.id } });
    await expect(result).toHaveProperty('id', testItem.id);
  });

  it('Item削除', async () => {
    const result = await itemService.remove({ where: { id: testItem.id } });
    await expect(result).toHaveProperty('id', testItem.id);
  });
});
