'use client';

import { ChevronRightIcon, UserGroupIcon } from '@heroicons/react/20/solid';
import { BackendImage } from '@/components/backend-image';
import { classNames } from '@/utils';
import Link from 'next/link';

type DraftData = {
  id: string;
  title: string;
  circle?: {
    id: string;
    name: string;
  };
};

export function List({ active, drafts }: { active?: string; drafts: DraftData[] }) {
  return (
    <ul role="list" className="divide-y divide-gray-200">
      {drafts.map((draft) => (
        <li
          key={draft.id}
          className={classNames(
            active === draft.id ? 'bg-gray-50' : 'hover:bg-gray-50',
            'relative flex justify-between gap-x-6 px-4 py-3 sm:px-6 lg:px-8',
          )}
        >
          <div className="flex gap-x-4">
            {draft.circle ? (
              <BackendImage
                src={`/circles/${draft.circle?.id}/photo`}
                className="h-16 w-16 flex-none rounded-md bg-gray-50"
                alt="circle-icon"
                fallback={<UserGroupIcon className="h-16 w-16 flex-none rounded-lg text-gray-300 bg-gray-50" />}
              />
            ) : (
              <UserGroupIcon className="h-16 w-16 flex-none rounded-lg text-gray-300 bg-gray-50" />
            )}
            <div className="min-w-0 flex-auto">
              <p>{draft.circle?.name || 'サークル連携なし'}</p>
              <p className="text-sm font-semibold leading-6 text-gray-900">
                <Link href={`/drafts/${draft.id}`}>
                  <span className="absolute inset-x-0 -top-px bottom-0" />
                  {draft.title}
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
