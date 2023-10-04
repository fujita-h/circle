'use client';

import { classNames } from '@/utils';
import { usePathname } from 'next/navigation';
import { TabItem } from './types';
import Link from 'next/link';
import React from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export function NavigationTabs({ tabs }: { tabs: TabItem[] }) {
  const pathname = usePathname();
  tabs.forEach((tab) => {
    Array.isArray(tab.href) ? (tab.current = tab.href.includes(pathname)) : (tab.current = tab.href === pathname);
  });

  return (
    <nav className="-mb-px flex space-x-4">
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
              'whitespace-nowrap border-b-2 px-1 lg:px-2 pb-2 text-base font-semibold',
              inter.className,
            )}
            aria-current={tab.current ? 'page' : undefined}
          >
            {tab.name}
            {tab.count !== undefined ? (
              <span
                className={classNames(
                  tab.current ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900',
                  'ml-3 hidden rounded-full py-0.5 px-2.5 text-xs font-medium md:inline-block',
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
