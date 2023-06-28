import { CommentStatus } from '@prisma/client';

export class CreateCommentDto {
  user: {
    id: string;
  };
  item: {
    id: string;
  };
  body: string;
  status: CommentStatus;
}
