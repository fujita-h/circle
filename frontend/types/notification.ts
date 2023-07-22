import { User } from './user';

export interface Notification {
  id: string;
  createdAt: string;
  updatedAt: string;
  User?: User;
  userId: string;
  type: NotificationType;
  status: NotificationStatus;
  title?: string;
  message?: string;
}

export type NotificationType = 'NORMAL';
export type NotificationStatus = 'UNREAD' | 'READ' | 'DELETED';
