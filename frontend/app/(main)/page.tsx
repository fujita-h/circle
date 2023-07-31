import { classNames } from '@/utils';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { LargeTabs, TabItem } from '@/components/tabs';

const inter = Inter({ subsets: ['latin'] });
const tabs: TabItem[] = [
  { name: 'Trendig', href: `/`, current: false },
  { name: 'Following', href: `/notes`, current: false },
  { name: 'Explore', href: `/notes`, current: false },
];

export default function Page() {
  return (
    <div>
      {/* Header area */}
      <div className="pt-4 bg-white">
        <div className="max-w-screen-2xl mx-auto">
          <div className="px-4 lg:px-20">
            <LargeTabs tabs={tabs} />
          </div>
        </div>
      </div>

      <div className="bg-slate-100 print:bg-white border-t border-gray-200">
        <div className="max-w-screen-2xl mx-auto">
          <div className="p-4 md:p-8">
            <div className="bg-white rounded-md p-4">
              <div className={classNames('text-xl font-bold text-center', inter.className)}>Dashbord Area</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
