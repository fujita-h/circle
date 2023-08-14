import { Membership } from './membership';
import { Note } from './note';
import { FollowGroup } from './follow-group';

export interface Group {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: GroupStatus;
  handle?: string;
  name?: string;
  description?: string;
  joinGroupCondition: ConditionJoinGroup;
  writeNotePermission: PermissionWriteNote;
  readNotePermission: PermissionReadNote;
  Members?: Membership[];
  Notes?: Note[];
  Watched?: FollowGroup[];

  // include count
  _count?: {
    Members?: number;
    Notes?: number;
  };
}

export type GroupStatus = 'NORMAL' | 'DELETED';

export type ConditionJoinGroup = 'DENIED' | 'REQUIRE_ADMIN_APPROVAL' | 'ALLOWED';
export type PermissionWriteNote = 'ADMIN' | 'MEMBER' | 'ALL';
export type PermissionReadNote = 'ADMIN' | 'MEMBER' | 'ALL';
