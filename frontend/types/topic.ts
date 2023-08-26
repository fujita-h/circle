import { Note } from './note';

export interface Topic {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  displayName?: string;
  haveIcon: boolean;
  Notes?: Note[];
}
