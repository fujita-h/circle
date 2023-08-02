'use client';

import { classNames } from '@/utils';
import { usePathname } from 'next/navigation';
import { TabItem } from './types';
import Link from 'next/link';
import React from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export function LargeTabs({ tabs }: { tabs: TabItem[] }) {
  const pathname = usePathname();
  tabs.forEach((tab) => {
    tab.current = tab.href === pathname;
  });

  return (
    <nav className="-mb-px flex space-x-4">
      {tabs.map((tab) => (
        <Link
          key={tab.name}
          href={tab.href}
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
        </Link>
      ))}
    </nav>
  );
}
