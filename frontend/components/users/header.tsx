import { CategoryHeader } from '../category-header';
import { TabItem } from '../category-header.types';

export function UserCategoryHeader({ title, tabs }: { title: string; tabs: TabItem[] }) {
  return <CategoryHeader title={title} tabs={tabs} />;
}
