import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PassportModule } from '@nestjs/passport';
import { OidcJwtStrategy } from './guards/jwt.strategy';
import { CirclesModule } from './circles/circles.module';
import { NotesModule } from './notes/notes.module';
import { UsersService } from './users/users.service';
import { AzblobService } from './azblob/azblob.service';
import { EsService } from './es/es.service';
import { UserModule } from './user/user.module';
import { DraftsModule } from './drafts/drafts.module';
import { NotesService } from './notes/notes.service';
import { CirclesService } from './circles/circles.service';
import { MembershipsService } from './memberships/memberships.service';
import { FilesModule } from './files/files.module';
import { CommentsService } from './comments/comments.service';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env.test', '.env'],
      isGlobal: true,
    }),
    CacheModule.register(),
    PassportModule,
    UsersModule,
    CirclesModule,
    NotesModule,
    UserModule,
    DraftsModule,
    FilesModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    OidcJwtStrategy,
    UsersService,
    AzblobService,
    EsService,
    NotesService,
    CirclesService,
    MembershipsService,
    CommentsService,
  ],
})
export class AppModule {}
