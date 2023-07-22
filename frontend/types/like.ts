import { User } from './user';
import { Note } from './note';

export interface Like {
  User?: User;
  userId: string;
  Note?: Note;
  noteId: string;
  createdAt: string;
  updatedAt: string;
}
