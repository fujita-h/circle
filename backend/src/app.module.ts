import { Module } from '@nestjs/common';

import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';

import { OidcJwtStrategy } from './guards/jwt.strategy';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { TasksService } from './tasks.service';

import { CommentsController } from './comments/comments.controller';
import { DraftsController } from './drafts/drafts.controller';
import { FilesController } from './files/files.controller';
import { GroupsController } from './groups/groups.controller';
import { NotesController } from './notes/notes.controller';
import { UserController } from './user/user.controller';
import { UsersController } from './users/users.controller';

import { AzblobService } from './azblob/azblob.service';
import { CommentsService } from './comments/comments.service';
import { EsService } from './es/es.service';
import { FollowGroupsService } from './follow-groups/follow-groups.service';
import { FollowTopicsService } from './follow-topics/follow-topics.service';
import { FollowUsersService } from './follow-users/follow-users.service';
import { GroupsService } from './groups/groups.service';
import { LikesService } from './likes/likes.service';
import { MembershipsService } from './memberships/memberships.service';
import { NotesService } from './notes/notes.service';
import { NotificationsService } from './notifications/notifications.service';
import { StockLabelsService } from './stock-labels/stock-labels.service';
import { StocksService } from './stocks/stocks.service';
import { TopicsService } from './topics/topics.service';
import { UsersService } from './users/users.service';
import { TopicsController } from './topics/topics.controller';
import { TopicMapsService } from './topic-maps/topic-maps.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV}.local`, '.env.local'],
      isGlobal: true,
    }),
    CacheModule.register(),
    PassportModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    CommentsController,
    DraftsController,
    FilesController,
    GroupsController,
    NotesController,
    UserController,
    UsersController,
    TopicsController,
  ],
  providers: [
    TasksService,
    PrismaService,
    OidcJwtStrategy,
    AzblobService,
    CommentsService,
    EsService,
    FollowGroupsService,
    FollowTopicsService,
    FollowUsersService,
    GroupsService,
    LikesService,
    MembershipsService,
    NotesService,
    NotificationsService,
    RedisService,
    StockLabelsService,
    StocksService,
    TopicsService,
    UsersService,
    TopicMapsService,
  ],
})
export class AppModule {}
