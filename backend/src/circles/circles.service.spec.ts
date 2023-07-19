import { Test, TestingModule } from '@nestjs/testing';
import { CirclesService } from './circles.service';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { EsService } from '../es/es.service';

const testPrefix = 'x-test-circles-service-';
const deleteTestCircles = async (circlesService: CirclesService) => {
  await circlesService
    .findMany({ where: { handle: { startsWith: testPrefix } } })
    .then(async (results) => {
      for (const result of results) {
        await circlesService.remove({ where: { id: result.id } });
      }
    });
};
const Circle = (
  handle: string,
  name: string,
  rp?: 'ADMIN' | 'MEMBER' | 'ALL',
  wp?: 'ADMIN' | 'MEMBER' | 'ALL',
  wc?: 'REQUIRE_ADMIN_APPROVAL' | 'ALLOWED',
  jc?: 'REQUIRE_ADMIN_APPROVAL' | 'ALLOWED',
): Prisma.CircleCreateInput => ({
  handle: testPrefix + handle,
  name: testPrefix + name,
  readNotePermission: rp,
  writeNotePermission: wp,
  writeNoteCondition: wc,
  joinCircleCondition: jc,
});

describe('CirclesService', () => {
  let service: CirclesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CirclesService, ConfigService, EsService],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
        }),
      ],
    }).compile();

    service = module.get<CirclesService>(CirclesService);

    await deleteTestCircles(service);
  });

  afterAll(async () => {
    await deleteTestCircles(service);
  });

  const testCircle1 = Circle('1', '1');

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  let circle1: any;
  it('サークルを作成', async () => {
    const result = service.create({ data: testCircle1 });
    circle1 = await result;
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('name', testCircle1.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
    await expect(result).resolves.not.toHaveProperty('notes');
    await expect(result).resolves.not.toHaveProperty('members');
  });

  it('サークルを取得', async () => {
    const result = service.findOne({ where: { id: circle1.id } });
    await expect(result).resolves.toHaveProperty('id', circle1.id);
    await expect(result).resolves.toHaveProperty('name', testCircle1.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
    await expect(result).resolves.not.toHaveProperty('notes');
    await expect(result).resolves.not.toHaveProperty('members');
  });

  it('サークルをInclude付きで取得', async () => {
    const result = service.findOne({
      where: { id: circle1.id },
      include: { notes: true, members: true },
    });
    await expect(result).resolves.toHaveProperty('id', circle1.id);
    await expect(result).resolves.toHaveProperty('name', testCircle1.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
    await expect(result).resolves.toHaveProperty('notes');
    await expect(result).resolves.toHaveProperty('members');
  });

  it('サークルをhandleから取得', async () => {
    const result = service.findFirst({ where: { handle: circle1.handle } });
    await expect(result).resolves.toHaveProperty('id', circle1.id);
    await expect(result).resolves.toHaveProperty('name', testCircle1.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
  });

  it('サークルをhandleからInclude付きで取得', async () => {
    const result = service.findFirst({
      where: { handle: circle1.handle },
      include: { notes: true, members: true },
    });
    await expect(result).resolves.toHaveProperty('id', circle1.id);
    await expect(result).resolves.toHaveProperty('name', testCircle1.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
    await expect(result).resolves.toHaveProperty('notes');
    await expect(result).resolves.toHaveProperty('members');
  });

  it('サークルを削除', async () => {
    const result = service.remove({ where: { id: circle1.id } });
    await expect(result).resolves.toHaveProperty('id', circle1.id);
    await expect(result).resolves.toHaveProperty('name', testCircle1.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
  });

  it('サークルを作成', async () => {
    const result = service.create({ data: testCircle1 });
    circle1 = await result;
    await expect(result).resolves.toHaveProperty('id');
    await expect(result).resolves.toHaveProperty('name', testCircle1.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
    await expect(result).resolves.not.toHaveProperty('notes');
    await expect(result).resolves.not.toHaveProperty('members');
  });

  it('サークルを更新', async () => {
    const result = service.update({
      where: { id: circle1.id },
      data: { name: testCircle1.name + 'updated' },
    });
    circle1 = await result;
    await expect(result).resolves.toHaveProperty('id', circle1.id);
    await expect(result).resolves.toHaveProperty('name', testCircle1.handle + 'updated');
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
  });

  it('サークルを削除', async () => {
    const result = service.remove({ where: { id: circle1.id } });
    await expect(result).resolves.toHaveProperty('id', circle1.id);
    await expect(result).resolves.toHaveProperty('name', testCircle1.handle + 'updated');
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
  });

  it('存在しないサークルを取得 => ', async () => {
    const result = service.findOne({ where: { id: circle1.id } });
    await expect(result).resolves.toBeNull();
  });

  it('サークルをInclude付きで作成', async () => {
    const result = service.create({ data: testCircle1, include: { notes: true, members: true } });
    circle1 = await result;
    await expect(result).resolves.toHaveProperty('id', circle1.id);
    await expect(result).resolves.toHaveProperty('name', testCircle1.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle1.handle);
    await expect(result).resolves.toHaveProperty('notes');
    await expect(result).resolves.toHaveProperty('members');
  });

  it('全サークルを取得', async () => {
    const result = await service.findAll();
    await expect(result.length).toBeGreaterThan(0);
    const circle = result.find((circle) => circle.id === circle1.id);
    await expect(circle).toBeDefined();
    await expect(circle).toHaveProperty('id', circle1.id);
    await expect(circle).toHaveProperty('name', testCircle1.name);
    await expect(circle).toHaveProperty('handle', testCircle1.handle);
  });

  it('全サークルをInclude付きで取得', async () => {
    const result = await service.findAll({ include: { notes: true, members: true } });
    await expect(result.length).toBeGreaterThan(0);
    const circle = result.find((circle) => circle.id === circle1.id);
    await expect(circle).toBeDefined();
    await expect(circle).toHaveProperty('id', circle1.id);
    await expect(circle).toHaveProperty('name', testCircle1.name);
    await expect(circle).toHaveProperty('handle', testCircle1.handle);
    await expect(circle).toHaveProperty('notes');
    await expect(circle).toHaveProperty('members');
  });

  it('サークルをSoft Delete', async () => {
    const result = await service.update({
      where: { id: circle1.id },
      data: { handle: null },
    });
    await expect(result).toHaveProperty('id', circle1.id);
    await expect(result).toHaveProperty('name', testCircle1.name);
    await expect(result).toHaveProperty('handle', null);
  });

  it('サークルを削除', async () => {
    const result = await service.remove({ where: { id: circle1.id } });
    await expect(result).toHaveProperty('id', circle1.id);
    await expect(result).toHaveProperty('name', testCircle1.name);
  });
});
