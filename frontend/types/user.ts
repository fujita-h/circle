import { Membership } from './membership';
import { Comment } from './comment';
import { Note } from './note';
import { Stock } from './stock';
import { Like } from './like';
import { Follow } from './follow';
import { Watch } from './watch';
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
  Likes?: Like[];
  Following?: Follow[];
  Followed?: Follow[];
  Watching?: Watch[];
  Notifications?: Notification[];
}

export type UserType = 'NORMAL';

export type UserStatus = 'NORMAL' | 'DELETED';
