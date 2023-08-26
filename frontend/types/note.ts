import { User } from './user';
import { Group } from './group';
import { Topic } from './topic';
import { Comment } from './comment';
import { Stock } from './stock';
import { Like } from './like';

export interface Note {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  User?: User;
  userId: string;
  Group?: Group;
  groupId?: string;
  title?: string;
  blobPointer?: string;
  draftBlobPointer?: string;
  type: NoteType;
  status: NoteStatus;
  writeCommentPermission: PermissionWriteComment;
  Topics?: Topic[];
  Comments?: Comment[];
  Stocked?: Stock[];
  Liked?: Like[];

  // include count
  _count?: {
    Topics?: number;
    Comments?: number;
    Stocked?: number;
    Liked?: number;
  };

  // API based
  body: string;
}

export type NoteType = 'NORMAL' | 'SHARED';
export type NoteStatus = 'NORMAL' | 'DELETED' | 'PENDING_APPROVAL' | 'REJECTED_BY_ADMIN' | 'EXCLUDED_BY_ADMIN';
export type PermissionWriteComment = 'OWNER' | 'MEMBER' | 'ALL';
