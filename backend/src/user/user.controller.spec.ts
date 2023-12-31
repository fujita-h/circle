import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserController } from './user.controller';

import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';

import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';
import { FollowGroupsService } from '../follow-groups/follow-groups.service';
import { FollowTopicsService } from '../follow-topics/follow-topics.service';
import { FollowUsersService } from '../follow-users/follow-users.service';
import { GroupsService } from '../groups/groups.service';
import { LikesService } from '../likes/likes.service';
import { MembershipsService } from '../memberships/memberships.service';
import { NotesService } from '../notes/notes.service';
import { StockLabelsService } from '../stock-labels/stock-labels.service';
import { StocksService } from '../stocks/stocks.service';
import { TopicsService } from '../topics/topics.service';
import { UsersService } from '../users/users.service';
import { UserSettingService } from '../user-setting/user-setting.service';

class CreateUserDtoForTest extends CreateUserDto {
  id: string;
}

describe('UserController', () => {
  let controller: UserController;
  let usersService: UsersService;

  const testPrefix = 'x-usr-ctl-';
  const testUser: CreateUserDtoForTest = {
    id: testPrefix + '0123-456789',
    oid: testPrefix + 'oid',
    handle: testPrefix + 'handle',
    name: testPrefix + 'name',
    email: testPrefix + 'email',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UsersService,
        PrismaService,
        EsService,
        AzblobService,
        GroupsService,
        MembershipsService,
        NotesService,
        LikesService,
        StocksService,
        StockLabelsService,
        RedisService,
        FollowUsersService,
        FollowGroupsService,
        FollowTopicsService,
        TopicsService,
        UserSettingService,
      ],
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV}.local`, '.env.local'],
        }),
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    usersService = module.get<UsersService>(UsersService);

    // delete test user if exists
    await usersService.findOne({ where: { id: testUser.id } }).then(async (result) => {
      if (result && result.id) {
        await usersService.remove({ where: { id: result.id } });
        //await sleep(100);
      }
    });
  });

  beforeEach(async () => {
    //
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return new user object', async () => {
    const result = usersService.create({ data: testUser });
    await expect(result).resolves.toHaveProperty('id', testUser.id);
    await expect(result).resolves.toHaveProperty('handle', testUser.handle);
    await expect(result).resolves.toHaveProperty('name', testUser.name);
    await expect(result).resolves.toHaveProperty('email', testUser.email);
  });

  it('should return user object', async () => {
    const req = { user: { id: testUser.id } };
    const result = controller.findOne(req);
    await expect(result).resolves.toHaveProperty('id', testUser.id);
    await expect(result).resolves.toHaveProperty('handle', testUser.handle);
    await expect(result).resolves.toHaveProperty('name', testUser.name);
    await expect(result).resolves.toHaveProperty('email', testUser.email);
  });

  it('should return updated user object (1)', async () => {
    const req = { user: { id: testUser.id } };
    const result = controller.update(req, {
      handle: undefined,
      name: testUser.name + '2',
      email: undefined,
    });
    await expect(result).resolves.toHaveProperty('id', testUser.id);
    await expect(result).resolves.toHaveProperty('handle', testUser.handle);
    await expect(result).resolves.toHaveProperty('name', testUser.name + '2');
    await expect(result).resolves.toHaveProperty('email', testUser.email);
  });

  it('should return updated user object (2)', async () => {
    const req = { user: { id: testUser.id } };
    const result = controller.update(req, {
      handle: testUser.handle + '2',
      name: undefined,
      email: undefined,
    });
    await expect(result).resolves.toHaveProperty('id', testUser.id);
    await expect(result).resolves.toHaveProperty('handle', testUser.handle + '2');
    await expect(result).resolves.toHaveProperty('name', testUser.name + '2');
    await expect(result).resolves.toHaveProperty('email', testUser.email);
  });
});
