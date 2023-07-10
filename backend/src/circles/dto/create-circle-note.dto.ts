import { NoteStatus } from '@prisma/client';

export class CreateCircleNoteDto {
  title: string;
  body: string;
  status: NoteStatus;
}
