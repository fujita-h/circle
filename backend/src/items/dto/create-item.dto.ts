import { ItemStatus } from '@prisma/client';

export class CreateItemDto {
  group: {
    id: string;
  };
  title: string;
  body: string;
  status: ItemStatus;
}
