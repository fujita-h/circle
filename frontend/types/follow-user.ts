import { User } from './user';
export interface FollowUser {
  From?: User;
  fromId: string;
  To?: User;
  toId: string;
  createdAt: string;
  updatedAt: string;
}
