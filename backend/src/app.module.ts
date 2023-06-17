import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PassportModule } from '@nestjs/passport';
import { OidcJwtStrategy } from './guards/jwt.strategy';
import { GroupsModule } from './groups/groups.module';
import { ItemsModule } from './items/items.module';
import { UsersService } from './users/users.service';
import { AzblobService } from './azblob/azblob.service';
import { EsService } from './es/es.service';
import { UserModule } from './user/user.module';
import { DraftsModule } from './drafts/drafts.module';
import { ItemsService } from './items/items.service';
import { GroupsService } from './groups/groups.service';
import { UserGroupsService } from './user-groups/user-groups.service';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env.test', '.env'],
      isGlobal: true,
    }),
    CacheModule.register(),
    PassportModule,
    UsersModule,
    GroupsModule,
    ItemsModule,
    UserModule,
    DraftsModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    OidcJwtStrategy,
    UsersService,
    AzblobService,
    EsService,
    ItemsService,
    GroupsService,
    UserGroupsService,
  ],
})
export class AppModule {}
