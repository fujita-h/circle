'use client';

import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { classNames } from '@/utils';
import Link from 'next/link';

type ItemData = {
  id: string;
  title: string;
};

export function ItemList({ active, items }: { active?: string; items: ItemData[] }) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {items.map((item) => (
        <li
          key={item.id}
          className={classNames(
            active === item.id ? 'bg-gray-100' : 'hover:bg-gray-50',
            'relative flex justify-between gap-x-6 px-4 py-3 sm:px-6 lg:px-8',
          )}
        >
          <div className="flex gap-x-4">
            <img className="h-16 w-16 flex-none rounded-lg bg-gray-50" src={item.id} alt="" />
            <div className="min-w-0 flex-auto">
              <p>--group-name--here--</p>
              <p className="text-sm font-semibold leading-6 text-gray-900">
                <Link href={`/drafts/${item.id}`}>
                  <span className="absolute inset-x-0 -top-px bottom-0" />
                  {item.title}
                </Link>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-x-4">
            <div className="hidden sm:flex sm:flex-col sm:items-end">{/* somthing to right */}</div>
            <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
          </div>
        </li>
      ))}
    </ul>
  );
}
