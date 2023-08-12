import { Membership } from './membership';
import { Comment } from './comment';
import { Note } from './note';
import { Stock } from './stock';
import { StockLabel } from './stock-label';
import { Like } from './like';
import { FollowUser } from './follow-user';
import { FollowGroup } from './follow-group';
import { Notification } from './notification';

export interface User {
  id: string;
  oid: string;
  createdAt: string;
  updatedAt: string;
  type: UserType;
  status: UserStatus;
  handle?: string;
  name?: string;
  email?: string;
  Joined: Membership[];
  Comments: Comment[];
  Notes?: Note[];
  Stocks?: Stock[];
  StockLabels?: StockLabel[];
  Likes?: Like[];
  FollowingUsers?: FollowUser[];
  FollowedUsers?: FollowUser[];
  FollowingGroups?: FollowGroup[];
  Notifications?: Notification[];

  // include count
  _count?: {
    Joined?: number;
    Notes?: number;
  };
}

export type UserType = 'NORMAL';

export type UserStatus = 'NORMAL' | 'DELETED';
