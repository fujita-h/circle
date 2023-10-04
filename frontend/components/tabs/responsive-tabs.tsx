'use client';

import { classNames } from '@/utils';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { TabItem } from './types';

const inter = Inter({ subsets: ['latin'] });

export function ResponsiveTabs({ tabs, dynamic = true }: { tabs: TabItem[]; dynamic?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  if (dynamic) {
    tabs.forEach((tab) => {
      Array.isArray(tab.href) ? (tab.current = tab.href.includes(pathname)) : (tab.current = tab.href === pathname);
    });
  }

  return (
    <div className="border-b border-gray-200 pb-5 sm:pb-0">
      <div>
        <div className="sm:hidden">
          <label htmlFor="current-tab" className="sr-only">
            Select a tab
          </label>
          <select
            id="current-tab"
            name="current-tab"
            className={classNames(
              inter.className,
              'block w-full rounded-md border-0 py-1.5 pl-3 pr-10 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600',
            )}
            defaultValue={tabs.find((tab) => tab.current)?.name}
            onChange={(e) => {
              const href = tabs.find((tab) => tab.name === e.target.value)?.href;
              if (Array.isArray(href)) {
                router.push(href[0]);
              } else if (href) {
                router.push(href);
              }
            }}
          >
            {tabs.map((tab) => (
              <option key={tab.name}>{tab.name}</option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const href = Array.isArray(tab.href) ? tab.href[0] : tab.href;
              return (
                <Link
                  key={tab.name}
                  href={href}
                  className={classNames(
                    tab.current
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    'whitespace-nowrap border-b-2 px-2 pb-2 text-sm font-semibold',
                    inter.className,
                  )}
                  aria-current={tab.current ? 'page' : undefined}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
