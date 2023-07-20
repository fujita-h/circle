import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PassportModule } from '@nestjs/passport';
import { OidcJwtStrategy } from './guards/jwt.strategy';

import { AzblobService } from './azblob/azblob.service';
import { CommentsController } from './comments/comments.controller';
import { CommentsService } from './comments/comments.service';
import { DraftsController } from './drafts/drafts.controller';
import { EsService } from './es/es.service';
import { FilesController } from './files/files.controller';
import { FollowsService } from './follows/follows.service';
import { GroupsController } from './groups/groups.controller';
import { GroupsService } from './groups/groups.service';
import { LikesService } from './likes/likes.service';
import { MembershipsService } from './memberships/memberships.service';
import { NotesService } from './notes/notes.service';
import { NotesController } from './notes/notes.controller';
import { NotificationsService } from './notifications/notifications.service';
import { StocksService } from './stocks/stocks.service';
import { TagsService } from './tags/tags.service';
import { UserController } from './user/user.controller';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { WatchesService } from './watches/watches.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env.test', '.env'],
      isGlobal: true,
    }),
    CacheModule.register(),
    PassportModule,
  ],
  controllers: [
    CommentsController,
    DraftsController,
    FilesController,
    GroupsController,
    NotesController,
    UserController,
    UsersController,
  ],
  providers: [
    OidcJwtStrategy,
    AzblobService,
    CommentsService,
    EsService,
    FollowsService,
    GroupsService,
    LikesService,
    MembershipsService,
    NotesService,
    NotificationsService,
    StocksService,
    TagsService,
    UsersService,
    WatchesService,
  ],
})
export class AppModule {}
