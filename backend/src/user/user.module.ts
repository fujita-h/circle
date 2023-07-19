import { Module } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserController } from './user.controller';
import { GroupsService } from '../groups/groups.service';
import { MembershipsService } from '../memberships/memberships.service';
import { EsService } from '../es/es.service';
import { AzblobService } from '../azblob/azblob.service';

@Module({
  controllers: [UserController],
  providers: [UsersService, GroupsService, MembershipsService, EsService, AzblobService],
})
export class UserModule {}
