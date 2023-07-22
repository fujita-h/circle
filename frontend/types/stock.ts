import { User } from './user';
import { Note } from './note';
import { StockLabel } from './stock-label';
export interface Stock {
  User?: User;
  userId: string;
  Note?: Note;
  noteId: string;
  Label?: StockLabel;
  labelId: string;
  createdAt: string;
  updatedAt: string;
}
