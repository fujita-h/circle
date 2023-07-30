import { ResponsiveTabs, TabItem } from '@/components/tabs';

export function UserCategoryHeader({ title, tabs }: { title: string; tabs: TabItem[] }) {
  return (
    <>
      <div className="mb-4 text-lg font-semibold leading-6 text-gray-900">{title}</div>
      <ResponsiveTabs tabs={tabs} />
    </>
  );
}
