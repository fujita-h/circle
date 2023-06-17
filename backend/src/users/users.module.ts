import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EsService } from '../es/es.service';
import { PhotoController } from './photo/photo.controller';
import { PhotoModule } from './photo/photo.module';
import { AzblobService } from '../azblob/azblob.service';
import { ItemsService } from '../items/items.service';

@Module({
  controllers: [UsersController, PhotoController],
  providers: [UsersService, ItemsService, EsService, AzblobService],
  imports: [PhotoModule],
})
export class UsersModule {}
