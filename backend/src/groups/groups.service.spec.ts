import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { GroupsService } from './groups.service';
import { EsService } from '../es/es.service';

const testPrefix = 'x-test-groups-service-';
const deleteTestGroups = async (groupsService: GroupsService) => {
  await groupsService
    .findMany({ where: { handle: { startsWith: testPrefix } } })
    .then(async (results) => {
      for (const result of results[0]) {
        await groupsService.remove({ where: { id: result.id } });
      }
    });
};
const Group = (
  handle: string,
  name: string,
  rp?: 'ADMIN' | 'MEMBER' | 'ALL',
  wp?: 'ADMIN' | 'MEMBER' | 'ALL',
  wc?: 'REQUIRE_ADMIN_APPROVAL' | 'ALLOWED',
  jc?: 'DENIED' | 'REQUIRE_ADMIN_APPROVAL' | 'ALLOWED',
): Prisma.GroupCreateInput => ({
  handle: testPrefix + handle,
  name: testPrefix + name,
  readNotePermission: rp,
  writeNotePermission: wp,
  writeNoteCondition: wc,
  joinGroupCondition: jc,
});

describe('GroupsService', () => {
  let service: GroupsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupsService, PrismaService, EsService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);

    await deleteTestGroups(service);
  });

  afterAll(async () => {
    await deleteTestGroups(service);
  });

  const testGroup1 = Group('1', '1');

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  let group1: any;
  it('サークルを作成', async () => {
    const result = service.create({ data: testGroup1 });
    group1 = await result;
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('name', testGroup1.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
    await expect(result).resolves.not.toHaveProperty('notes');
    await expect(result).resolves.not.toHaveProperty('members');
  });

  it('サークルを取得', async () => {
    const result = service.findOne({ where: { id: group1.id } });
    await expect(result).resolves.toHaveProperty('id', group1.id);
    await expect(result).resolves.toHaveProperty('name', testGroup1.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
    await expect(result).resolves.not.toHaveProperty('notes');
    await expect(result).resolves.not.toHaveProperty('members');
  });

  it('サークルをInclude付きで取得', async () => {
    const result = service.findOne({
      where: { id: group1.id },
      include: { Notes: true, Members: true },
    });
    await expect(result).resolves.toHaveProperty('id', group1.id);
    await expect(result).resolves.toHaveProperty('name', testGroup1.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
    await expect(result).resolves.toHaveProperty('Notes');
    await expect(result).resolves.toHaveProperty('Members');
  });

  it('サークルをhandleから取得', async () => {
    const result = service.findFirst({ where: { handle: group1.handle } });
    await expect(result).resolves.toHaveProperty('id', group1.id);
    await expect(result).resolves.toHaveProperty('name', testGroup1.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
  });

  it('サークルをhandleからInclude付きで取得', async () => {
    const result = service.findFirst({
      where: { handle: group1.handle },
      include: { Notes: true, Members: true },
    });
    await expect(result).resolves.toHaveProperty('id', group1.id);
    await expect(result).resolves.toHaveProperty('name', testGroup1.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
    await expect(result).resolves.toHaveProperty('Notes');
    await expect(result).resolves.toHaveProperty('Members');
  });

  it('サークルを削除', async () => {
    const result = service.remove({ where: { id: group1.id } });
    await expect(result).resolves.toHaveProperty('id', group1.id);
    await expect(result).resolves.toHaveProperty('name', testGroup1.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
  });

  it('サークルを作成', async () => {
    const result = service.create({ data: testGroup1 });
    group1 = await result;
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('name', testGroup1.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
    await expect(result).resolves.not.toHaveProperty('notes');
    await expect(result).resolves.not.toHaveProperty('members');
  });

  it('サークルを更新', async () => {
    const result = service.update({
      where: { id: group1.id },
      data: { name: testGroup1.name + 'updated' },
    });
    group1 = await result;
    await expect(result).resolves.toHaveProperty('id', group1.id);
    await expect(result).resolves.toHaveProperty('name', testGroup1.handle + 'updated');
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
  });

  it('サークルを削除', async () => {
    const result = service.remove({ where: { id: group1.id } });
    await expect(result).resolves.toHaveProperty('id', group1.id);
    await expect(result).resolves.toHaveProperty('name', testGroup1.handle + 'updated');
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
  });

  it('存在しないサークルを取得 => ', async () => {
    const result = service.findOne({ where: { id: group1.id } });
    await expect(result).resolves.toBeNull();
  });

  it('サークルをInclude付きで作成', async () => {
    const result = service.create({ data: testGroup1, include: { Notes: true, Members: true } });
    group1 = await result;
    await expect(result).resolves.toHaveProperty('id', group1.id);
    await expect(result).resolves.toHaveProperty('name', testGroup1.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup1.handle);
    await expect(result).resolves.toHaveProperty('Notes');
    await expect(result).resolves.toHaveProperty('Members');
  });

  it('全サークルを取得', async () => {
    const result = await service.findAll();
    await expect(result.length).toBeGreaterThan(0);
    const group = result.find((group) => group.id === group1.id);
    await expect(group).toBeDefined();
    await expect(group).toHaveProperty('id', group1.id);
    await expect(group).toHaveProperty('name', testGroup1.name);
    await expect(group).toHaveProperty('handle', testGroup1.handle);
  });

  it('全サークルをInclude付きで取得', async () => {
    const result = await service.findAll({ include: { Notes: true, Members: true } });
    await expect(result.length).toBeGreaterThan(0);
    const group = result.find((group) => group.id === group1.id);
    await expect(group).toBeDefined();
    await expect(group).toHaveProperty('id', group1.id);
    await expect(group).toHaveProperty('name', testGroup1.name);
    await expect(group).toHaveProperty('handle', testGroup1.handle);
    await expect(group).toHaveProperty('Notes');
    await expect(group).toHaveProperty('Members');
  });

  it('サークルをSoft Delete', async () => {
    const result = await service.update({
      where: { id: group1.id },
      data: { handle: null },
    });
    await expect(result).toHaveProperty('id', group1.id);
    await expect(result).toHaveProperty('name', testGroup1.name);
    await expect(result).toHaveProperty('handle', null);
  });

  it('サークルを削除', async () => {
    const result = await service.remove({ where: { id: group1.id } });
    await expect(result).toHaveProperty('id', group1.id);
    await expect(result).toHaveProperty('name', testGroup1.name);
  });
});
