'use client';

import { ChevronRightIcon, UserIcon, UserGroupIcon } from '@heroicons/react/20/solid';
import { BackendImage } from '@/components/backend-image';
import { classNames } from '@/utils';
import Link from 'next/link';

type ItemData = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  group: {
    id: String;
    handle: string;
    name: string;
  };
  user: {
    id: string;
    handle: string;
    name: string;
  };
};

export function ItemList({ items }: { items: ItemData[] }) {
  console.log(items);
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {items.map((item) => {
        const createdAt = new Date(item.createdAt);
        const updatedAt = new Date(item.updatedAt);
        return (
          <li key={item.id} className="relative flex justify-between gap-x-6 px-4 py-3 hover:bg-gray-50 sm:px-6 lg:px-8">
            <div className="flex gap-x-2">
              <BackendImage
                src={`/users/${item.user.id}/photo`}
                className="h-8 w-8 rounded-full bg-gray-50"
                alt="user-icon"
                fallback={<UserIcon className="h-8 w-8 rounded-full bg-gray-100 text-gray-400" />}
              />

              <div className="min-w-0 flex-auto">
                <div className="text-sm flex gap-x-2">
                  <Link className="z-10 hover:underline" href={`/u/${item.user.handle}`}>
                    <span>@{item.user.handle}</span>
                  </Link>
                  {item.user.name ? <span>({item.user.name})</span> : <></>}
                </div>
                <div className="text-sm">{`${createdAt.getFullYear()}年${createdAt.getMonth() + 1}月${createdAt.getDate()}日`}</div>
                <div className="text-xl font-semibold leading-6 text-gray-900">
                  <Link className="hover:underline" href={`/items/${item.id}`}>
                    <span className="absolute inset-x-0 -top-px bottom-0" />
                    {item.title}
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-x-4">
              <div className="hidden sm:flex sm:flex-col sm:items-end">{/* somthing to right */}</div>
              <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
