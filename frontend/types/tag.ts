import { Note } from './note';

export interface Tag {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  displayName?: string;
  haveIcon: boolean;
  Notes?: Note[];
}
