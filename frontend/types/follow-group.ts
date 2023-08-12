import { User } from './user';
import { Group } from './group';

export interface FollowGroup {
  User?: User;
  userId: string;
  Group?: Group;
  groupId: string;
  createdAt: string;
  updatedAt: string;
}
