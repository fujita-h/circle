import * as readline from 'readline';
import * as yargs from 'yargs';

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EventEmitter } from 'events';
import { init } from '@paralleldrive/cuid2';

import { AzblobService } from '../azblob/azblob.service';
import { TasksService } from '../tasks.service';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { NotesService } from '../notes/notes.service';
import { RedisService } from '../redis.service';

import { UserController } from '../user/user.controller';
import { UsersController } from '../users/users.controller';
import { GroupsController } from '../groups/groups.controller';
import { NotesController } from '../notes/notes.controller';

EventEmitter.defaultMaxListeners = 100;
const createCuid = init({ length: 24 });

const log = (...args: any[]) => {
  console.log(new Date(), ...args);
};

const concurrentPromise = async <T>(
  promises: (() => Promise<T>)[],
  concurrency: number,
): Promise<any[]> => {
  const results: T[] = [];
  let currentIndex = 0;

  while (true) {
    const chunks = promises.slice(currentIndex, currentIndex + concurrency);
    if (chunks.length === 0) {
      break;
    }
    Array.prototype.push.apply(results, await Promise.allSettled(chunks.map((c) => c())));
    currentIndex += concurrency;
  }
  return results;
};

async function createUsers(count: number) {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const usersController = appContext.get(UsersController);
        const tasks = [];
        for (let i = 0; i < count; i++) {
          const cuid = createCuid();
          tasks.push(() =>
            usersController.create({
              oid: 'seed-' + cuid,
              handle: 'seed-' + cuid,
              name: 'seed-' + cuid,
            }),
          );
        }
        const results = await concurrentPromise(tasks, 32);
        for (const result of results) {
          if (result.status === 'rejected') {
            log('Error:', result.reason.response);
          }
        }
        resolve(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
            .map((u) => u.id),
        );
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function getUsers(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const usersService = appContext.get(UsersService);
        const [users] = await usersService.findMany({
          where: { oid: { startsWith: 'seed-' } },
        });
        resolve(users.map((user) => user.id));
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function deleteUsers(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const usersService = appContext.get(UsersService);
        const [users] = await usersService.findMany({
          where: { oid: { startsWith: 'seed-' } },
        });
        const results = await concurrentPromise(
          users.map((user) => () => usersService.remove({ where: { id: user.id } })),
          32,
        );
        for (const result of results) {
          if (result.status === 'rejected') {
            log('Error:', result.reason.response || result.reason);
          }
        }
        resolve(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
            .map((u) => u.id),
        );
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function createGroups(users: string[], count: number) {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const groupsController = appContext.get(GroupsController);
        const tasks = [];
        for (let i = 0; i < count; i++) {
          const cuid = createCuid();
          const user = users[Math.floor(Math.random() * users.length)];
          const req = { user: { id: user } };
          tasks.push(() =>
            groupsController.create(req, {
              handle: 'seed-' + cuid,
              name: 'seed-' + cuid,
              joinGroupCondition: 'ALLOWED',
              writeNotePermission: 'ALL',
              readNotePermission: 'ALL',
            }),
          );
        }
        const results = await concurrentPromise(tasks, 8);
        for (const result of results) {
          if (result.status === 'rejected') {
            log('Error:', result.reason.response || result.reason);
          }
        }
        resolve(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
            .map((g) => g.id),
        );
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function getGroups(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const groupsService = appContext.get(GroupsService);
        const [groups] = await groupsService.findMany({
          where: { Members: { some: { User: { oid: { startsWith: 'seed-' } } } } },
        });
        resolve(groups.map((group) => group.id));
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function deleteGroups(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const groupsService = appContext.get(GroupsService);
        const [groups] = await groupsService.findMany({
          where: { Members: { some: { User: { oid: { startsWith: 'seed-' } } } } },
        });
        const results = await concurrentPromise(
          groups.map((group) => () => groupsService.remove({ where: { id: group.id } })),
          32,
        );
        for (const result of results) {
          if (result.status === 'rejected') {
            log('Error:', result.reason.response || result.reason);
          }
        }
        resolve(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
            .map((g) => g.id),
        );
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function createNotes(users: string[], groups: string[], count: number) {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const notesController = appContext.get(NotesController);
        const tasks = [];
        for (let i = 0; i < count; i++) {
          const cuid = createCuid();
          const user = users[Math.floor(Math.random() * users.length)];
          const group =
            Math.random() > 0.5 ? groups[Math.floor(Math.random() * groups.length)] : undefined;
          const req = { user: { id: user } };

          tasks.push(() =>
            notesController.create(req, {
              title: 'seed-' + cuid,
              group: { id: group || '' },
              body: 'seed-' + cuid,
              status: 'NORMAL',
              writeCommentPermission: 'ALL',
            }),
          );
        }
        const results = await concurrentPromise(tasks, 32);
        for (const result of results) {
          if (result.status === 'rejected') {
            log('Error:', result.reason.response || result.reason);
          }
        }
        resolve(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
            .map((n) => n.id),
        );
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function getNotes(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const notesService = appContext.get(NotesService);
        const [notes] = await notesService.findMany({
          where: { User: { oid: { startsWith: 'seed-' } } },
        });
        resolve(notes.map((note) => note.id));
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function deteleNotes() {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const notesService = appContext.get(NotesService);
        const azblobService = appContext.get(AzblobService);
        const redisService = appContext.get(RedisService);

        const [notes] = await notesService.findMany({
          where: { User: { oid: { startsWith: 'seed-' } } },
        });
        const results = await concurrentPromise(
          notes.map((note) => () => notesService.remove({ where: { id: note.id } })),
          32,
        );
        const deleted = [];
        for (const result of results) {
          if (result.status === 'fulfilled') {
            deleted.push(result.value.id);
          } else if (result.status === 'rejected') {
            log('Error (DB):', result.reason.response || result.reason);
          }
        }

        const blobResults = await concurrentPromise(
          deleted.map((note) => () => azblobService.deleteBlobDirectory('note', `${note}`)),
          32,
        );
        for (const result of blobResults) {
          if (result.status === 'rejected') {
            log('Error (BLOB):', result.reason.response || result.reason);
          }
        }

        if (deleted.length > 0) {
          const redisKeys = await redisService.keys('notes/*');
          for (const redisKey of redisKeys) {
            log(redisKey);
            log(await redisService.zrem(redisKey, deleted));
          }
        }

        resolve(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
            .map((n) => n.id),
        );
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function followUsers(users: string[], count: number) {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const userController = appContext.get(UserController);
        const tasks = [];
        for (let i = 0; i < count; i++) {
          const user = users[Math.floor(Math.random() * users.length)];
          const user2 = users[Math.floor(Math.random() * users.length)];
          const req = { user: { id: user } };
          tasks.push(() => userController.followUser(req, user2));
        }
        const results = await concurrentPromise(tasks, 32);
        for (const result of results) {
          if (result.status === 'rejected') {
            //suppressed: if same user follows same user, it will be rejected.
            //log('Error:', result.reason.response || result.reason);
          }
        }
        resolve(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
            .map((f) => ({ fromId: f.fromId, toId: f.toId })),
        );
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function followUsersFrom(user: string, users: string[], count: number) {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const userController = appContext.get(UserController);
        const tasks = [];
        for (let i = 0; i < count; i++) {
          const user2 = users[Math.floor(Math.random() * users.length)];
          const req = { user: { id: user } };
          tasks.push(() => userController.followUser(req, user2));
        }
        const results = await concurrentPromise(tasks, 1);
        for (const result of results) {
          if (result.status === 'rejected') {
            log('Error:', result.reason.response || result.reason);
          }
        }
        resolve(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
            .map((f) => f.toId),
        );
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function followGroups(users: string[], groups: string[], count: number) {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const userController = appContext.get(UserController);
        const tasks = [];
        for (let i = 0; i < count; i++) {
          const user = users[Math.floor(Math.random() * users.length)];
          const group = groups[Math.floor(Math.random() * groups.length)];
          const req = { user: { id: user } };
          tasks.push(() => userController.followGroup(req, group));
        }
        const results = await concurrentPromise(tasks, 32);
        for (const result of results) {
          if (result.status === 'rejected') {
            //suppressed: if same user follows same group, it will be rejected.
            //log('Error:', result.reason.response || result.reason);
          }
        }
        resolve(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
            .map((f) => ({ userId: f.userId, groupId: f.groupId })),
        );
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function followGroupsFrom(user: string, groups: string[], count: number) {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const userController = appContext.get(UserController);
        const tasks = [];
        for (let i = 0; i < count; i++) {
          const group = groups[Math.floor(Math.random() * groups.length)];
          const req = { user: { id: user } };
          tasks.push(() => userController.followGroup(req, group));
        }
        const results = await concurrentPromise(tasks, 1);
        for (const result of results) {
          if (result.status === 'rejected') {
            log('Error:', result.reason.response || result.reason);
          }
        }
        resolve(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
            .map((f) => f.groupId),
        );
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function joinGroups(users: string[], groups: string[], count: number) {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const userController = appContext.get(UserController);
        const tasks = [];
        for (let i = 0; i < count; i++) {
          const user = users[Math.floor(Math.random() * users.length)];
          const group = groups[Math.floor(Math.random() * groups.length)];
          const req = { user: { id: user } };
          tasks.push(() => userController.joinGroup(req, group));
        }
        const results = await concurrentPromise(tasks, 32);
        for (const result of results) {
          if (result.status === 'rejected') {
            log('Error:', result.reason.response || result.reason);
          }
        }
        resolve(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
            .map((j) => ({
              userId: j.userId,
              groupId: j.groupId,
            })),
        );
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function accessNotes(users: string[], notes: string[], count: number) {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const notesController = appContext.get(NotesController);
        const tasks = [];
        for (let i = 0; i < count; i++) {
          const user = users[Math.floor(Math.random() * users.length)];
          const note = notes[Math.floor(Math.random() * notes.length)];
          const req = { user: { id: user } };
          tasks.push(() => notesController.findOne(req, note));
        }
        const results = await concurrentPromise(tasks, 32);
        for (const result of results) {
          if (result.status === 'rejected') {
            log('Error:', result.reason.response || result.reason);
          }
        }
        resolve(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
            .map((n) => n.id),
        );
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function likeNotes(users: string[], notes: string[], count: number) {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const userController = appContext.get(UserController);
        const tasks = [];
        for (let i = 0; i < count; i++) {
          const user = users[Math.floor(Math.random() * users.length)];
          const note = notes[Math.floor(Math.random() * notes.length)];
          const req = { user: { id: user } };
          tasks.push(() => userController.likeNote(req, note));
        }
        const results = await concurrentPromise(tasks, 32);
        for (const result of results) {
          if (result.status === 'rejected') {
            log('Error:', result.reason.response || result.reason);
          }
        }
        resolve(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
            .map((l) => ({ userId: l.data.userId, noteId: l.data.noteId })),
        );
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function stockNotes(users: string[], notes: string[], count: number) {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const userController = appContext.get(UserController);
        const tasks = [];
        for (let i = 0; i < count; i++) {
          const user = users[Math.floor(Math.random() * users.length)];
          const note = notes[Math.floor(Math.random() * notes.length)];
          const req = { user: { id: user } };
          tasks.push(() => userController.stockNote(req, note));
        }
        const results = await concurrentPromise(tasks, 32);
        for (const result of results) {
          if (result.status === 'rejected') {
            log('Error:', result.reason.response || result.reason);
          }
        }
        resolve(
          results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value)
            .map((s) => ({ userId: s.data.userId, noteId: s.data.noteId })),
        );
      })
      .catch((e) => {
        reject(e);
      });
  });
}

async function updateTrending() {
  return new Promise((resolve, reject) => {
    NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })
      .then(async (appContext) => {
        const tasksService = appContext.get(TasksService);
        await tasksService.handleWeeklyTrending();
        await tasksService.handleMonthlyTrending();
        resolve('done');
      })
      .catch((e) => {
        reject(e);
      });
  });
}

const confirm = async (msg: string) => {
  const answer = await question(`${msg} (y/n): `);
  return answer.trim().toLowerCase() === 'y';
};

const question = (question: string): Promise<string> => {
  const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    readlineInterface.question(question, (answer) => {
      resolve(answer);
      readlineInterface.close();
    });
  });
};

const argv: any = yargs
  .command('user <count>', 'create users', (yargs) =>
    yargs.positional('count', {
      describe: 'user count',
      type: 'number',
    }),
  )
  .command('group <count>', 'create groups', (yargs) =>
    yargs.positional('count', {
      describe: 'group count',
      type: 'number',
    }),
  )
  .command('join <count>', 'join groups', (yargs) =>
    yargs.positional('count', {
      describe: 'join count',
      type: 'number',
    }),
  )
  .command('follow <type> <count>', 'follow users or groups', (yargs) =>
    yargs
      .positional('type', {
        describe: 'follow type',
        choices: ['user', 'group'],
      })
      .positional('count', {
        describe: 'follow count',
        type: 'number',
      }),
  )
  .command('follow-from <id> <type> <count>', 'follow from specific user', (yargs) =>
    yargs
      .positional('id', {
        describe: 'user id',
        type: 'string',
      })
      .positional('type', {
        describe: 'follow type',
        choices: ['user', 'group'],
      })
      .positional('count', {
        describe: 'follow count',
        type: 'number',
      }),
  )
  .command('note <count>', 'create notes', (yargs) =>
    yargs.positional('count', {
      describe: 'note count',
      type: 'number',
    }),
  )
  .command('access <count>', 'access notes', (yargs) =>
    yargs.positional('count', {
      describe: 'access count',
      type: 'number',
    }),
  )
  .command('like <count>', 'like notes', (yargs) =>
    yargs.positional('count', {
      describe: 'like count',
      type: 'number',
    }),
  )
  .command('stock <count>', 'stock notes', (yargs) =>
    yargs.positional('count', {
      describe: 'stock count',
      type: 'number',
    }),
  )
  .command('delete', 'delete all seed data')
  .demandCommand(1).argv;

switch (argv._[0]) {
  case 'user':
    (async () => {
      const users = await createUsers(argv.count);
      log(users);
      log('Ctrl + C to exit.');
    })();
    break;
  case 'group':
    (async () => {
      const users = await getUsers();
      const groups = await createGroups(users, argv.count);
      log(groups);
      log('Ctrl + C to exit.');
    })();
    break;
  case 'join':
    (async () => {
      const users = await getUsers();
      log(users.length);
      const groups = await getGroups();
      log(groups.length);
      const joins = await joinGroups(users, groups, argv.count);
      log(joins);
      log('Ctrl + C to exit.');
    })();
    break;
  case 'follow':
    if (argv.type === 'user') {
      (async () => {
        const users = await getUsers();
        const follows = await followUsers(users, argv.count);
        log(follows);
        log('Ctrl + C to exit.');
      })();
    } else if (argv.type === 'group') {
      (async () => {
        const users = await getUsers();
        const groups = await getGroups();
        const follows = await followGroups(users, groups, argv.count);
        log(follows);
        log('Ctrl + C to exit.');
      })();
    }
    break;
  case 'follow-from':
    if (argv.type === 'user') {
      (async () => {
        const users = await getUsers();
        const follows = await followUsersFrom(argv.id, users, argv.count);
        log(follows);
        log('Ctrl + C to exit.');
      })();
    } else if (argv.type === 'group') {
      (async () => {
        const groups = await getGroups();
        const follows = await followGroupsFrom(argv.id, groups, argv.count);
        log(follows);
        log('Ctrl + C to exit.');
      })();
    }
    break;
  case 'note':
    (async () => {
      const users = await getUsers();
      const groups = await getGroups();
      const notes = await createNotes(users, groups, argv.count);
      log(notes);
      log('Ctrl + C to exit.');
    })();
    break;
  case 'access':
    (async () => {
      const users = await getUsers();
      const notes = await getNotes();
      const accesses = await accessNotes(users, notes, argv.count);
      await updateTrending();
      log(accesses);
      log('Ctrl + C to exit.');
    })();
    break;
  case 'like':
    (async () => {
      const users = await getUsers();
      const notes = await getNotes();
      const likes = await likeNotes(users, notes, argv.count);
      await updateTrending();
      log(likes);
      log('Ctrl + C to exit.');
    })();
    break;
  case 'stock':
    (async () => {
      const users = await getUsers();
      const notes = await getNotes();
      const stocks = await stockNotes(users, notes, argv.count);
      await updateTrending();
      log(stocks);
      log('Ctrl + C to exit.');
    })();
    break;
  case 'delete':
    (async () => {
      if (await confirm('> confirm delete all seed data?')) {
        log('Deleting Notes...');
        await deteleNotes();
        log('Deleting Groups...');
        await deleteGroups();
        log('Deleting Users...');
        await deleteUsers();
        log('Done');
        log('Ctrl + C to exit.');
      }
    })();
    break;
  default:
    log(argv);
    log('Unknown command');
    break;
}
