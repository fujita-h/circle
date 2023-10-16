import { TabItem } from '@/components/tabs';

export const navTabItems: TabItem[] = [
  { name: 'Portal', href: `/`, current: false },
  { name: 'Following', href: `/following`, current: false },
  { name: 'Explore', href: ['/notes/explore', '/groups/explore', '/topics/explore'], current: false },
];
