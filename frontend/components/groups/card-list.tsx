'use client';
import { ChevronRightIcon, UserGroupIcon } from '@heroicons/react/20/solid';
import { classNames } from '@/utils';
import { BackendImage } from '@/components/backend-image';
import { TypesColors } from './type-colors';
import Link from 'next/link';

type GroupData = {
  id: string;
  type: 'OPEN' | 'PUBLIC' | 'PRIVATE';
  name: string;
  handle: string;
  description: string;
  imageUrl: string;
};

export function CardList({ groups }: { groups: GroupData[] }) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {groups.map((group) => (
        <li key={group.id} className="relative flex justify-between gap-x-6 px-4 py-3 hover:bg-gray-50 sm:px-6 lg:px-8">
          <div className="flex gap-x-4">
            <BackendImage
              src={`/groups/${group.id}/photo`}
              className="h-16 w-16 flex-none rounded-md bg-gray-50"
              alt="group-icon"
              fallback={<UserGroupIcon className="h-16 w-16 flex-none rounded-lg text-gray-300 bg-gray-50" />}
            />
            <div className="min-w-0 flex-auto">
              <span
                className={classNames(
                  TypesColors[group.type],
                  'rounded-md whitespace-nowrap px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                )}
              >
                {group.type}
              </span>
              <p className="text-sm font-semibold leading-6 text-gray-900">
                <Link href={`/g/${group.handle}`}>
                  <span className="absolute inset-x-0 -top-px bottom-0" />
                  {group.name}
                </Link>
              </p>
              <p className="text-xs leading-5 text-gray-500 line-clamp-1">{group.description}</p>
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
