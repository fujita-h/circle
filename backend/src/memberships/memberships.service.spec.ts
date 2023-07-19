import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsService } from './memberships.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { EsService } from '../es/es.service';

describe('MembershipsService', () => {
  let service: MembershipsService;
  let usersService: UsersService;
  let groupsService: GroupsService;

  const testPrefix = 'x-ug-svc-';
  const testUser = {
    id: testPrefix + '0123-456789',
    handle: testPrefix + 'handle',
    name: testPrefix + 'name',
  };
  const testGroup = {
    id: testPrefix + '9876-543210',
    handle: testPrefix + 'handle',
    name: testPrefix + 'name',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MembershipsService, ConfigService, UsersService, GroupsService, EsService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    service = module.get<MembershipsService>(MembershipsService);
    usersService = module.get<UsersService>(UsersService);
    groupsService = module.get<GroupsService>(GroupsService);

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
    expect(service).toBeDefined();
  });

  it('ユーザーを作成', async () => {
    const result = usersService.create({ data: testUser });
    await expect(result).resolves.toHaveProperty('id', testUser.id);
    await expect(result).resolves.toHaveProperty('name', testUser.name);
    await expect(result).resolves.toHaveProperty('handle', testUser.handle);
  });

  it('グループを作成', async () => {
    const result = groupsService.create({ data: testGroup });
    await expect(result).resolves.toHaveProperty('id', testGroup.id);
    await expect(result).resolves.toHaveProperty('name', testGroup.name);
    await expect(result).resolves.toHaveProperty('handle', testGroup.handle);
  });

  it('ユーザーをグループに追加', async () => {
    const result = service.createIfNotExists({
      userId: testUser.id,
      groupId: testGroup.id,
      role: 'MEMBER',
    });
    await expect(result).resolves.toHaveProperty('userId', testUser.id);
    await expect(result).resolves.toHaveProperty('groupId', testGroup.id);
  });

  it('ユーザーをグループに追加(2)', async () => {
    const result = service.createIfNotExists({
      userId: testUser.id,
      groupId: testGroup.id,
      role: 'MEMBER',
    });
    await expect(result).resolves.toHaveProperty('userId', testUser.id);
    await expect(result).resolves.toHaveProperty('groupId', testGroup.id);
  });

  it('ユーザーをグループから削除', async () => {
    const result = service.removeIfExists({
      userId: testUser.id,
      groupId: testGroup.id,
    });
    await expect(result).resolves.toHaveProperty('userId', testUser.id);
    await expect(result).resolves.toHaveProperty('groupId', testGroup.id);
  });

  it('ユーザーをグループから削除(2)', async () => {
    const result = service.removeIfExists({
      userId: testUser.id,
      groupId: testGroup.id,
    });
    await expect(result).resolves.toBeNull();
  });
});
