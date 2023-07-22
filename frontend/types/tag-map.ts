import { Note } from './note';
import { Tag } from './tag';

export interface TagMap {
  Note?: Note;
  noteId: string;
  Tag?: Tag;
  tagId: string;
  createdAt: string;
  updatedAt: string;
}
