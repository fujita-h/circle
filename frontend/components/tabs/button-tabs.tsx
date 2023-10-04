'use client';

import { classNames } from '@/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { TabItem } from './types';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export function ButtonTabs({ tabs }: { tabs: TabItem[] }) {
  const pathname = usePathname();
  tabs.forEach((tab) => {
    Array.isArray(tab.href) ? (tab.current = tab.href.includes(pathname)) : (tab.current = tab.href === pathname);
  });
  return (
    <nav className="isolate flex divide-x divide-gray-200 rounded-lg" aria-label="Tabs">
      {tabs.map((tab, tabIdx) => {
        const href = Array.isArray(tab.href) ? tab.href[0] : tab.href;
        return (
          <Link
            key={tab.name}
            href={href}
            className={classNames(
              tab.current ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
              tabIdx === 0 ? 'rounded-l-lg' : '',
              tabIdx === tabs.length - 1 ? 'rounded-r-lg' : '',
              'group shadow relative min-w-0 flex-1 sm:flex-none sm:w-28 overflow-hidden bg-white py-2 px-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10',
            )}
            aria-current={tab.current ? 'page' : undefined}
          >
            <span>{tab.name}</span>
            <span
              aria-hidden="true"
              className={classNames(tab.current ? 'bg-indigo-500' : 'bg-transparent', 'absolute inset-x-0 bottom-0 h-0.5', inter.className)}
            />
          </Link>
        );
      })}
    </nav>
  );
}
