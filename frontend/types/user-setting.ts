import { User } from './user';

export interface UserSetting {
  id: string;
  User: User;
  userId: string;
  listNotesStyle: StyleListNotes;
  createdAt: string;
  updatedAt: string;
}

export type StyleListNotes = 'CARD' | 'LIST';
