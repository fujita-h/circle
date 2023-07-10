import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotesService } from '../notes/notes.service';
import { ConfigModule } from '@nestjs/config';
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
      providers: [UsersService, MembershipsService, NotesService, EsService, AzblobService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    // delete test user if exists
    await usersService.findOne({ where: { id: testUser.id } }).then(async (result) => {
      if (result && result.id) {
        await usersService.remove({ where: { id: result.id } });
        //await sleep(100);
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
    await expect(result).rejects.toHaveProperty('status', 500);
  });

  it('should return user objects in the loop', async () => {
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

  it('should return user object for deleted', async () => {
    const result = controller.remove(testUser.id);
    await expect(result).resolves.toHaveProperty('id', testUser.id);
  });
});
