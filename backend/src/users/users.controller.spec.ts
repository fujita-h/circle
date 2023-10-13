import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotesService } from '../notes/notes.service';
import { CreateUserDto } from './dto/create-user.dto';
import { EsService } from '../es/es.service';
import { AzblobService } from '../azblob/azblob.service';
import { MembershipsService } from '../memberships/memberships.service';

//const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec));

class CreateUserDtoForTest extends CreateUserDto {
  id: string;
}

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const testPrefix = 'x-usrs-ctl-';
  const testUser: CreateUserDtoForTest = {
    id: testPrefix + '0123-456789',
    oid: testPrefix + 'oid',
    handle: testPrefix + 'handle',
    name: testPrefix + 'name',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        PrismaService,
        MembershipsService,
        NotesService,
        EsService,
        AzblobService,
      ],
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.${process.env.NODE_ENV}.local`, '.env.local'],
        }),
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    // delete test users
    await usersService
      .findManyInclude({
        where: {
          OR: [
            { id: { startsWith: testPrefix } },
            { oid: { startsWith: testPrefix } },
            { handle: { startsWith: testPrefix } },
          ],
        },
      })
      .then(async (results) => {
        if (results[0] && results[0].length > 0) {
          for (const result of results[0]) {
            await usersService.remove({ where: { id: result.id } });
          }
        }
      });
  });

  //beforeEach(async () => {
  //  await sleep(100);
  //});

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return created user object', async () => {
    const result = controller.create(testUser);
    await expect(result).resolves.toHaveProperty('id', testUser.id);
    await expect(result).resolves.toHaveProperty('name', testUser.name);
  });

  it('should return user object', async () => {
    const result = controller.findOne(testUser.id);
    await expect(result).resolves.toHaveProperty('id', testUser.id);
    await expect(result).resolves.toHaveProperty('name', testUser.name);
  });

  it('should return rejects for duplicated', async () => {
    const result = controller.create(testUser);
    await expect(result).rejects.toHaveProperty('status', 409);
  });

  it('should return user objects in the loop', async () => {
    const result = await controller.findMany(1, 0);
    const total = result.meta.total;
    const take = Math.floor(total / 10) + 1;
    let skip = 0;
    let end = false;
    while (!end) {
      const result = await controller.findMany(take, skip);
      expect(result.data.length).toBeLessThanOrEqual(take);
      skip += take;
      end = result.data.length < take;
    }
  });

  it('should return user object for deleted', async () => {
    const result = controller.remove({ user: { id: testUser.id } }, testUser.id);
    await expect(result).resolves.toHaveProperty('id', testUser.id);
  });
});
