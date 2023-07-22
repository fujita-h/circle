import { User } from './user';
import { Stock } from './stock';

export interface StockLabel {
  id: string;
  User?: User;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  Stocks?: Stock[];
}
