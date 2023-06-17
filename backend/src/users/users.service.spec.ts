import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { EsService } from '../es/es.service';

describe('UsersService', () => {
  let service: UsersService;

  const testPrefix = 'x-usrs-svc-';
  const testUser: Prisma.UserCreateInput = {
    id: testPrefix + '0123-456789',
    handle: testPrefix + 'handle',
    name: testPrefix + 'name',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, ConfigService, EsService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    // delete test user if exists
    await service.findOne({ where: { id: testUser.id } }).then(async (result) => {
      if (result && result.id) {
        await service.remove({ where: { id: result.id } });
      }
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be return new user object', async () => {
    const result = service.create({ data: testUser });
    await expect(result).resolves.toHaveProperty('id', testUser.id);
    await expect(result).resolves.toHaveProperty('handle', testUser.handle);
    await expect(result).resolves.toHaveProperty('name', testUser.name);
  });

  it('should be return user object', async () => {
    const result = service.findOne({ where: { id: testUser.id } });
    await expect(result).resolves.toHaveProperty('id', testUser.id);
    await expect(result).resolves.toHaveProperty('handle', testUser.handle);
    await expect(result).resolves.toHaveProperty('name', testUser.name);
  });

  it('should be return all user objects', async () => {
    const result = await service.findAll();
    await expect(result.length).toBeGreaterThan(0);
    const user = result.find((user) => user.id === testUser.id);
    await expect(user).toBeDefined();
    await expect(user).toHaveProperty('id', testUser.id);
    await expect(user).toHaveProperty('handle', testUser.handle);
  });

  it('should be return soft deleted user object', async () => {
    const result = service.update({
      where: { id: testUser.id },
      data: { oid: null, handle: null },
    });
    await expect(result).resolves.toHaveProperty('id', testUser.id);
    await expect(result).resolves.toHaveProperty('handle', null);
    await expect(result).resolves.toHaveProperty('name', testUser.name);
  });

  it('should be return soft deleted user object', async () => {
    const result = service.findOne({ where: { id: testUser.id } });
    await expect(result).resolves.toHaveProperty('id', testUser.id);
    await expect(result).resolves.toHaveProperty('handle', null);
    await expect(result).resolves.toHaveProperty('name', testUser.name);
  });

  it('should be return hard deleted user object', async () => {
    const result = service.remove({ where: { id: testUser.id } });
    await expect(result).resolves.toHaveProperty('id', testUser.id);
    await expect(result).resolves.toHaveProperty('name', testUser.name);
  });

  it('should be return null', async () => {
    const result = service.findOne({ where: { id: testUser.id } });
    await expect(result).resolves.toBeNull();
  });
});
