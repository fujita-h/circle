import { User } from './user';
import { Stock } from './stock';

export interface StockLabel {
  id: string;
  User?: User;
  userId: string;
  name: string;
  default: boolean;
  createdAt: string;
  updatedAt: string;
  Stocks?: Stock[];

  // include count
  _count?: {
    Stocks?: number;
  };
}
