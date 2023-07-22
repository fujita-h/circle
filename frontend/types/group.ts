import { Membership } from './membership';
import { Note } from './note';
import { Watch } from './watch';

export interface Group {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: GroupStatus;
  handle?: string;
  name?: string;
  description?: string;
  readNotePermission: PermissionReadNote;
  writeNotePermission: PermissionWriteNote;
  writeNoteCondition: ConditionWriteNote;
  joinGroupCondition: ConditionJoinGroup;
  Members?: Membership[];
  Notes?: Note[];
  Watched?: Watch[];
}

export type GroupStatus = 'NORMAL' | 'DELETED';

export type PermissionReadNote = 'ADMIN' | 'MEMBER' | 'ALL';
export type PermissionWriteNote = 'ADMIN' | 'MEMBER' | 'ALL';
export type ConditionWriteNote = 'REQUIRE_ADMIN_APPROVAL' | 'ALLOWED';
export type ConditionJoinGroup = 'DENIED' | 'REQUIRE_ADMIN_APPROVAL' | 'ALLOWED';
