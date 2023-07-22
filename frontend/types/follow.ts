import { User } from './user';
export interface Follow {
  From?: User;
  fromId: string;
  To?: User;
  toId: string;
  createdAt: string;
  updatedAt: string;
}
