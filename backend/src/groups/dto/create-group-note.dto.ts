import { NoteStatus } from '@prisma/client';

export class CreateGroupNoteDto {
  title: string;
  body: string;
  status: NoteStatus;
}
