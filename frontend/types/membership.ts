import { Group } from './group';
import { User } from './user';

export interface Membership {
  User?: User;
  userId: string;
  Group?: Group;
  groupId: string;
  role: MembershipRole;
  createdAt: string;
  updatedAt: string;
}

export type MembershipRole = 'ADMIN' | 'MEMBER' | 'PENDING_APPROVAL';
