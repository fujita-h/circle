import { Note } from './note';

export interface Topic {
  id: string;
  createdAt: string;
  updatedAt: string;
  handle: string;
  name: string;
  Notes?: Note[];
}
