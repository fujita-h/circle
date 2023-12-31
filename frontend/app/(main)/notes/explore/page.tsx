'use client';

import { exploreTabItems } from '@/app/(main)/explore-tab-items';
import { navTabItems } from '@/app/(main)/nav-tab-items';
import { ButtonTabs, NavigationTabs, ResponsiveTabs, TabItem } from '@/components/tabs';
import clsx from 'clsx';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader } from './loader';

const inter = Inter({ subsets: ['latin'] });
const tabItems: TabItem[] = [
  { name: 'Weekly', href: '/notes/explore', current: false },
  { name: 'Monthly', href: '/notes/explore?tab=monthly', current: false },
];
type tabNames = 'weekly' | 'monthly' | 'all';

export default function Page() {
  const searchParams = useSearchParams();
  const tab: tabNames = (searchParams.get('tab') as tabNames) || 'weekly';
  tabItems.forEach((tabItem) => {
    tabItem.current = tabItem.name.toLowerCase() === tab;
  });

  return (
    <div>
      {/* Header area */}
      <div className="pt-1 bg-white">
        <div className="max-w-screen-2xl mx-auto">
          <div className="pt-2 lg:pt-0 px-6 lg:px-8">
            <NavigationTabs tabs={navTabItems} />
          </div>
        </div>
      </div>

      <div className="bg-slate-100 print:bg-white border-t border-gray-200">
        <div className="max-w-screen-2xl mx-auto">
          <div className="p-4 md:p-8">
            <div className="px-4">
              <div>
                <ButtonTabs tabs={exploreTabItems} />
              </div>
              <div className="mt-6 ml-1">
                <p className={clsx(inter.className, 'text-3xl font-bold')}>Featured Notes</p>
                <p className="text-base text-gray-500">注目されている記事</p>
              </div>
              <div className="mt-6">
                <ResponsiveTabs tabs={tabItems} dynamic={false} />
              </div>
              <div className="mt-6">
                {tab === 'weekly' ? <Loader category="weekly" take={20} /> : <> </>}
                {tab === 'monthly' ? <Loader category="monthly" take={20} /> : <> </>}
              </div>
              <div className="mt-8 flex justify-center">
                <div>
                  <Link href="/notes" className="text-lg text-indigo-700 hover:text-indigo-500 hover:underline underline-offset-2">
                    すべての記事を見る
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
