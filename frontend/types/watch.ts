import { User } from './user';
import { Group } from './group';

export interface Watch {
  User?: User;
  userId: string;
  Group?: Group;
  groupId: string;
  createdAt: string;
  updatedAt: string;
}
