import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { EsService } from '../es/es.service';

describe('GroupsService', () => {
  let service: GroupsService;

  const testPrefix = 'x-grp-svc-';
  const testGroup: Prisma.GroupCreateInput = {
    id: testPrefix + '0123-456789',
    handle: testPrefix + 'handle',
    name: testPrefix + 'name',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupsService, ConfigService, EsService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);

    // delete test group if exists
    await service.findOne({ where: { id: testGroup.id } }).then(async (result) => {
      if (result && result.id) {
        await service.remove({ where: { id: result.id } });
      }
    });
  });

  beforeEach(async () => {
    //
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('グループを作成', async () => {
    const result = service.create({ data: testGroup });
    await expect(result).resolves.toHaveProperty('id', testGroup.id);
    await expect(result).resolves.toHaveProperty('name', testGroup.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup.handle);
  });

  it('グループを取得', async () => {
    const result = service.findOne({ where: { id: testGroup.id } });
    await expect(result).resolves.toHaveProperty('id', testGroup.id);
    await expect(result).resolves.toHaveProperty('name', testGroup.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup.handle);
  });

  it('グループをInclude付きで取得', async () => {
    const result = service.findOne({
      where: { id: testGroup.id },
      include: { items: true, members: true },
    });
    await expect(result).resolves.toHaveProperty('id', testGroup.id);
    await expect(result).resolves.toHaveProperty('name', testGroup.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup.handle);
    await expect(result).resolves.toHaveProperty('items');
    await expect(result).resolves.toHaveProperty('members');
  });

  it('グループをhandleから取得', async () => {
    const result = service.findFirst({ where: { handle: testGroup.handle } });
    await expect(result).resolves.toHaveProperty('id', testGroup.id);
    await expect(result).resolves.toHaveProperty('name', testGroup.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup.handle);
  });

  it('グループをhandleからInclude付きで取得', async () => {
    const result = service.findFirst({
      where: { handle: testGroup.handle },
      include: { items: true, members: true },
    });
    await expect(result).resolves.toHaveProperty('id', testGroup.id);
    await expect(result).resolves.toHaveProperty('name', testGroup.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup.handle);
    await expect(result).resolves.toHaveProperty('items');
    await expect(result).resolves.toHaveProperty('members');
  });

  it('グループを削除', async () => {
    const result = service.remove({ where: { id: testGroup.id } });
    await expect(result).resolves.toHaveProperty('id', testGroup.id);
    await expect(result).resolves.toHaveProperty('name', testGroup.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup.handle);
  });

  it('存在しないグループを取得 => ', async () => {
    const result = service.findOne({ where: { id: testGroup.id } });
    await expect(result).resolves.toBeNull();
  });

  it('グループをInclude付きで作成', async () => {
    const result = service.create({ data: testGroup, include: { items: true, members: true } });
    await expect(result).resolves.toHaveProperty('id', testGroup.id);
    await expect(result).resolves.toHaveProperty('name', testGroup.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup.handle);
    await expect(result).resolves.toHaveProperty('items');
    await expect(result).resolves.toHaveProperty('members');
  });

  it('全グループを取得', async () => {
    const result = await service.findAll();
    await expect(result.length).toBeGreaterThan(0);
    const group = result.find((group) => group.id === testGroup.id);
    await expect(group).toBeDefined();
    await expect(group).toHaveProperty('id', testGroup.id);
    await expect(group).toHaveProperty('name', testGroup.name);
    await expect(group).toHaveProperty('handle', testGroup.handle);
  });

  it('全グループをInclude付きで取得', async () => {
    const result = await service.findAll({ include: { items: true, members: true } });
    await expect(result.length).toBeGreaterThan(0);
    const group = result.find((group) => group.id === testGroup.id);
    await expect(group).toBeDefined();
    await expect(group).toHaveProperty('id', testGroup.id);
    await expect(group).toHaveProperty('name', testGroup.name);
    await expect(group).toHaveProperty('handle', testGroup.handle);
    await expect(group).toHaveProperty('items');
    await expect(group).toHaveProperty('members');
  });

  it('グループをSoft Delete', async () => {
    const result = await service.update({
      where: { id: testGroup.id },
      data: { handle: null },
    });
    await expect(result).toHaveProperty('id', testGroup.id);
    await expect(result).toHaveProperty('name', testGroup.name);
    await expect(result).toHaveProperty('handle', null);
  });

  it('グループを削除', async () => {
    const result = await service.remove({ where: { id: testGroup.id } });
    await expect(result).toHaveProperty('id', testGroup.id);
    await expect(result).toHaveProperty('name', testGroup.name);
  });
});
