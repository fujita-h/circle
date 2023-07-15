import { NoteStatus, PermissionWriteComment } from '@prisma/client';

export class CreateNoteDto {
  circle: {
    id: string;
  };
  title: string;
  body: string;
  status: NoteStatus;
  writeCommentPermission: PermissionWriteComment;
}
