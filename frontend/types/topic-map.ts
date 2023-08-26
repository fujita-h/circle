import { Note } from './note';
import { Topic } from './topic';

export interface TopicMap {
  Note?: Note;
  noteId: string;
  Topic?: Topic;
  topicId: string;
  createdAt: string;
  updatedAt: string;
}
