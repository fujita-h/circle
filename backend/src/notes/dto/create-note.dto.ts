import { NoteStatus, PermissionWriteComment } from '@prisma/client';

export class CreateNoteDto {
  group: {
    id: string;
  };
  topic: {
    ids: string[];
  };
  title: string;
  body: string;
  status: NoteStatus;
  writeCommentPermission: PermissionWriteComment;
}
