import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { ConfigModule } from '@nestjs/config';
import { AzblobService } from '../azblob/azblob.service';
import { EsService } from '../es/es.service';
import { UsersService } from '../users/users.service';
import { CirclesService } from '../circles/circles.service';
import { Prisma } from '@prisma/client';
import { CreateCircleDto } from '../circles/dto/create-circle.dto';
import { CreateCircleNoteDto } from '../circles/dto/create-circle-note.dto';
import { CirclesController } from '../circles/circles.controller';
import { CreateNoteDto } from './dto/create-note.dto';
import { CommentsService } from '../comments/comments.service';

describe('NotesController', () => {
  let controller: NotesController;
  let circlesController: CirclesController;
  let usersService: UsersService;
  let circlesService: CirclesService;
  let notesService: NotesService;
  let commentsService: CommentsService;

  class CreateCircleDtoForTest extends CreateCircleDto {
    id: string;
  }

  const testPrefix = 'x-itm-ctl-';
  const testUser1: Prisma.UserCreateInput = {
    id: testPrefix + 'u1-0123-456789',
    oid: testPrefix + 'u1-oid',
    handle: testPrefix + 'u1-handle',
    name: testPrefix + 'u1-name',
  };
  const testCircle1: CreateCircleDtoForTest = {
    id: testPrefix + 'g1-0123-456789',
    handle: testPrefix + 'g1-handle',
    name: testPrefix + 'g1-name',
    type: 'OPEN',
  };
  const testNote1: CreateNoteDto = {
    title: testPrefix + 'i1-title',
    body: testPrefix + 'i1-body',
    status: 'NORMAL',
    circle: { id: testCircle1.id },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController, CirclesController],
      providers: [
        NotesService,
        AzblobService,
        EsService,
        UsersService,
        CirclesService,
        CommentsService,
      ],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    circlesController = module.get<CirclesController>(CirclesController);
    usersService = module.get<UsersService>(UsersService);
    circlesService = module.get<CirclesService>(CirclesService);
    notesService = module.get<NotesService>(NotesService);

    // delete test note1 if exists
    await notesService
      .findMany({ where: { circle: { id: testCircle1.id } } })
      .then(async (results) => {
        if (results && results.length > 0) {
          for (const result of results) {
            await notesService.remove({ where: { id: result.id } });
          }
        }
      });
    // delete test user1 if exists
    await usersService.findOne({ where: { id: testUser1.id } }).then(async (result) => {
      if (result && result.id) {
        await usersService.remove({ where: { id: result.id } });
      }
    });
    // delete test circle1 if exists
    await circlesService.findOne({ where: { id: testCircle1.id } }).then(async (result) => {
      if (result && result.id) {
        await circlesService.remove({ where: { id: result.id } });
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

  it('User1がCircle1を作成', async () => {
    const req = { user: { id: testUser1.id } };
    const result = circlesController.create(req, testCircle1);
    await expect(result).resolves.toHaveProperty('id', testCircle1.id);
    await expect(result).resolves.toHaveProperty('name', testCircle1.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
    await expect(result).resolves.toHaveProperty('type', testCircle1.type);
  });

  it('Circle1に対してUser1でNote1を作成', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.create(req, testNote1);
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('title', testNote1.title);
    await expect(result).resolves.toHaveProperty('status', testNote1.status);
  });

  it('Circle1に対してUser1でNotesを取得', async () => {
    const req = { user: { id: testUser1.id } };
    const result = circlesController.findNotes(req, testCircle1.id);
    await expect(result).resolves.toHaveLength(1);
  });

  it('noteを取得', async () => {
    const req = { user: { id: testUser1.id } };
    const pre = await circlesController.findNotes(req, testCircle1.id);
    const result = controller.findOne(req, pre[0].id);
    await expect(result).resolves.toHaveProperty('id', pre[0].id);
    await expect(result).resolves.toHaveProperty('title', testNote1.title);
  });

  it('noteを更新', async () => {
    const req = { user: { id: testUser1.id } };
    const pre = await circlesController.findNotes(req, testCircle1.id);
    const result = controller.update(req, pre[0].id, {
      ...testNote1,
      title: 'updated-title',
      body: 'updated-body',
      circle: { id: testCircle1.id },
    });
    await expect(result).resolves.toHaveProperty('id', pre[0].id);
    await expect(result).resolves.toHaveProperty('title', 'updated-title');
  });

  it('noteを削除', async () => {
    const req = { user: { id: testUser1.id } };
    const pre = await circlesController.findNotes(req, testCircle1.id);
    const result = controller.remove(req, pre[0].id);
    await expect(result).resolves.toHaveProperty('id', pre[0].id);
    await expect(result).resolves.toHaveProperty('title', 'updated-title');
  });

  it('検索', async () => {
    const req = { user: { id: testUser1.id } };
    const result = controller.search(req, '', 0, 20);
    await expect(result).resolves.toBeDefined();
  });
});
