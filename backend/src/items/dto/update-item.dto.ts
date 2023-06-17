import { PartialType } from '@nestjs/mapped-types';
import { ItemStatus } from '@prisma/client';

export class UpdateItemDto {
  group: {
    id: string;
  };
  title: string;
  body: string;
  status: ItemStatus;
}

export class UpdatePartialItemDto extends PartialType(UpdateItemDto) {}
