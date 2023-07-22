import { User } from './user';
import { Note } from './note';

export interface Stock {
  User?: User;
  userId: string;
  Note?: Note;
  noteId: string;
  label?: string;
  createdAt: string;
  updatedAt: string;
}
