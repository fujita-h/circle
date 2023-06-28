import { PartialType } from '@nestjs/mapped-types';
import { CommentStatus } from '@prisma/client';

export class UpdateCommentDto {
  user: {
    id: string;
  };
  item: {
    id: string;
  };
  body: string;
  status: CommentStatus;
}

export class UpdatePartialCommentDto extends PartialType(UpdateCommentDto) {}
