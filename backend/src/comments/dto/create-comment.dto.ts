import { CommentStatus } from '@prisma/client';

export class CreateCommentDto {
  user: {
    id: string;
  };
  note: {
    id: string;
  };
  body: string;
  status: CommentStatus;
}
