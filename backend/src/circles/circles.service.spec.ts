import { Test, TestingModule } from '@nestjs/testing';
import { CirclesService } from './circles.service';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { EsService } from '../es/es.service';

describe('CirclesService', () => {
  let service: CirclesService;

  const testPrefix = 'x-grp-svc-';
  const testCircle: Prisma.CircleCreateInput = {
    id: testPrefix + '0123-456789',
    handle: testPrefix + 'handle',
    name: testPrefix + 'name',
  };

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

    // delete test circle if exists
    await service.findOne({ where: { id: testCircle.id } }).then(async (result) => {
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
    const result = service.create({ data: testCircle });
    await expect(result).resolves.toHaveProperty('id', testCircle.id);
    await expect(result).resolves.toHaveProperty('name', testCircle.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle.handle);
  });

  it('グループを取得', async () => {
    const result = service.findOne({ where: { id: testCircle.id } });
    await expect(result).resolves.toHaveProperty('id', testCircle.id);
    await expect(result).resolves.toHaveProperty('name', testCircle.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle.handle);
  });

  it('グループをInclude付きで取得', async () => {
    const result = service.findOne({
      where: { id: testCircle.id },
      include: { notes: true, members: true },
    });
    await expect(result).resolves.toHaveProperty('id', testCircle.id);
    await expect(result).resolves.toHaveProperty('name', testCircle.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle.handle);
    await expect(result).resolves.toHaveProperty('notes');
    await expect(result).resolves.toHaveProperty('members');
  });

  it('グループをhandleから取得', async () => {
    const result = service.findFirst({ where: { handle: testCircle.handle } });
    await expect(result).resolves.toHaveProperty('id', testCircle.id);
    await expect(result).resolves.toHaveProperty('name', testCircle.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle.handle);
  });

  it('グループをhandleからInclude付きで取得', async () => {
    const result = service.findFirst({
      where: { handle: testCircle.handle },
      include: { notes: true, members: true },
    });
    await expect(result).resolves.toHaveProperty('id', testCircle.id);
    await expect(result).resolves.toHaveProperty('name', testCircle.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle.handle);
    await expect(result).resolves.toHaveProperty('notes');
    await expect(result).resolves.toHaveProperty('members');
  });

  it('グループを削除', async () => {
    const result = service.remove({ where: { id: testCircle.id } });
    await expect(result).resolves.toHaveProperty('id', testCircle.id);
    await expect(result).resolves.toHaveProperty('name', testCircle.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle.handle);
  });

  it('存在しないグループを取得 => ', async () => {
    const result = service.findOne({ where: { id: testCircle.id } });
    await expect(result).resolves.toBeNull();
  });

  it('グループをInclude付きで作成', async () => {
    const result = service.create({ data: testCircle, include: { notes: true, members: true } });
    await expect(result).resolves.toHaveProperty('id', testCircle.id);
    await expect(result).resolves.toHaveProperty('name', testCircle.name);
    await expect(result).resolves.toHaveProperty('handle', testCircle.handle);
    await expect(result).resolves.toHaveProperty('notes');
    await expect(result).resolves.toHaveProperty('members');
  });

  it('全グループを取得', async () => {
    const result = await service.findAll();
    await expect(result.length).toBeGreaterThan(0);
    const circle = result.find((circle) => circle.id === testCircle.id);
    await expect(circle).toBeDefined();
    await expect(circle).toHaveProperty('id', testCircle.id);
    await expect(circle).toHaveProperty('name', testCircle.name);
    await expect(circle).toHaveProperty('handle', testCircle.handle);
  });

  it('全グループをInclude付きで取得', async () => {
    const result = await service.findAll({ include: { notes: true, members: true } });
    await expect(result.length).toBeGreaterThan(0);
    const circle = result.find((circle) => circle.id === testCircle.id);
    await expect(circle).toBeDefined();
    await expect(circle).toHaveProperty('id', testCircle.id);
    await expect(circle).toHaveProperty('name', testCircle.name);
    await expect(circle).toHaveProperty('handle', testCircle.handle);
    await expect(circle).toHaveProperty('notes');
    await expect(circle).toHaveProperty('members');
  });

  it('グループをSoft Delete', async () => {
    const result = await service.update({
      where: { id: testCircle.id },
      data: { handle: null },
    });
    await expect(result).toHaveProperty('id', testCircle.id);
    await expect(result).toHaveProperty('name', testCircle.name);
    await expect(result).toHaveProperty('handle', null);
  });

  it('グループを削除', async () => {
    const result = await service.remove({ where: { id: testCircle.id } });
    await expect(result).toHaveProperty('id', testCircle.id);
    await expect(result).toHaveProperty('name', testCircle.name);
  });
});
