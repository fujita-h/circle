import { ResponsiveTabs, TabItem } from '@/components/tabs';

const tabItems: TabItem[] = [
  { name: 'アカウント', href: '/settings/account', current: false },
  { name: '一般', href: '/settings/general', current: false },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-100 print:bg-white border-t border-gray-200">
      <div className="max-w-screen-2xl mx-auto">
        <div className="p-2 md:p-4">
          <div className="bg-white rounded-md p-4">
            <div className="mx-4 py-2">
              <ResponsiveTabs tabs={tabItems} />
            </div>
            <div>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
