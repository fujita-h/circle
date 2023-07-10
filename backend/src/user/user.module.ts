import { Module } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserController } from './user.controller';
import { CirclesService } from '../circles/circles.service';
import { MembershipsService } from '../memberships/memberships.service';
import { EsService } from '../es/es.service';
import { AzblobService } from '../azblob/azblob.service';

@Module({
  controllers: [UserController],
  providers: [UsersService, CirclesService, MembershipsService, EsService, AzblobService],
})
export class UserModule {}
