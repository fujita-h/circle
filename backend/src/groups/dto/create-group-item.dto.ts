import { ItemStatus } from '@prisma/client';

export class CreateGroupItemDto {
  title: string;
  body: string;
  status: ItemStatus;
}
