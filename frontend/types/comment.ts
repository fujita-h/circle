import { User } from './user';
import { Note } from './note';

export interface Comment {
  id: string;
  createdAt: string;
  updatedAt: string;
  Note?: Note;
  noteId: string;
  User?: User;
  userId: string;
  blobPointer?: string;
  type: CommentType;
  status: CommentStatus;
}

export type CommentType = 'NORMAL';
export type CommentStatus = 'NORMAL' | 'DELETED';
