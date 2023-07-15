import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsService } from './memberships.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { CirclesService } from '../circles/circles.service';
import { EsService } from '../es/es.service';

describe('MembershipsService', () => {
  let service: MembershipsService;
  let usersService: UsersService;
  let circlesService: CirclesService;

  const testPrefix = 'x-ug-svc-';
  const testUser = {
    id: testPrefix + '0123-456789',
    handle: testPrefix + 'handle',
    name: testPrefix + 'name',
  };
  const testCircle = {
    id: testPrefix + '9876-543210',
    handle: testPrefix + 'handle',
    name: testPrefix + 'name',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MembershipsService, ConfigService, UsersService, CirclesService, EsService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    service = module.get<MembershipsService>(MembershipsService);
    usersService = module.get<UsersService>(UsersService);
    circlesService = module.get<CirclesService>(CirclesService);

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

    // delete test circles
    await circlesService
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
            await circlesService.remove({ where: { id: result.id } });
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
    const result = circlesService.create({ data: testCircle });
    await expect(result).resolves.toHaveProperty('id', testCircle.id);
    await expect(result).resolves.toHaveProperty('name', testCircle.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle.handle);
  });

  it('ユーザーをグループに追加', async () => {
    const result = service.createIfNotExists({
      userId: testUser.id,
      circleId: testCircle.id,
    });
    await expect(result).resolves.toHaveProperty('userId', testUser.id);
    await expect(result).resolves.toHaveProperty('circleId', testCircle.id);
  });

  it('ユーザーをグループに追加(2)', async () => {
    const result = service.createIfNotExists({
      userId: testUser.id,
      circleId: testCircle.id,
    });
    await expect(result).resolves.toHaveProperty('userId', testUser.id);
    await expect(result).resolves.toHaveProperty('circleId', testCircle.id);
  });

  it('ユーザーをグループから削除', async () => {
    const result = service.removeIfExists({
      userId: testUser.id,
      circleId: testCircle.id,
    });
    await expect(result).resolves.toHaveProperty('userId', testUser.id);
    await expect(result).resolves.toHaveProperty('circleId', testCircle.id);
  });

  it('ユーザーをグループから削除(2)', async () => {
    const result = service.removeIfExists({
      userId: testUser.id,
      circleId: testCircle.id,
    });
    await expect(result).resolves.toBeNull();
  });
});
