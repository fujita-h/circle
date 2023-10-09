import { User } from './user';
import { Topic } from './topic';

export interface FollowTopic {
  User?: User;
  userId: string;
  Topic?: Topic;
  ropicId: string;
  createdAt: string;
  updatedAt: string;
}
