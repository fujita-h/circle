import { ResponsiveTabs, TabItem } from '@/components/tabs';

export function ItemCategoryHeader({ title, tabs }: { title: string; tabs: TabItem[] }) {
  return (
    <>
      <div className="mb-4 text-lg font-semibold leading-6 text-gray-900">{title}</div>
      <ResponsiveTabs tabs={tabs} />;
    </>
  );
}
