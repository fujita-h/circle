'use client';

import { BackendImage } from '@/components/backend-image';
import { Note, SomeRequired } from '@/types';
import { classNames } from '@/utils';
import { ChevronRightIcon, UserGroupIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export function CardList({ active, drafts }: { active?: string; drafts: SomeRequired<Note, 'User'>[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <ul role="list" className="grid grid-cols-1 gap-4">
      {drafts.map((draft) => {
        const updatedAt = new Date(draft.createdAt).toLocaleString('ja-jp', { year: 'numeric', month: 'short', day: 'numeric' });
        const params = new URLSearchParams(searchParams.toString());
        params.set('id', draft.id);
        const href = `${pathname}?${params.toString()}`;

        return (
          <li
            key={draft.id}
            className={classNames(
              active === draft.id ? 'ring-2 ring-indigo-600' : 'hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-300',
              'relative col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow',
            )}
          >
            <div className="flex gap-1 p-2">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    {draft.Group ? (
                      <BackendImage
                        src={`/groups/${draft.Group.id}/photo`}
                        className="h-5 w-5 flex-none rounded-md bg-gray-50"
                        alt="group-icon"
                        fallback={<UserGroupIcon className="h-6 w-6 flex-none rounded-lg text-gray-300 bg-gray-50" />}
                      />
                    ) : (
                      <></>
                    )}
                    <div className="text-sm truncate">{draft.Group?.name || 'グループなし'}</div>
                  </div>
                  <div className="text-sm">{updatedAt}</div>
                </div>
                <div>
                  <p className="text-sm font-semibold leading-6 text-gray-900">
                    <Link href={href}>
                      <span className="absolute inset-x-0 -top-px bottom-0" />
                      {draft.title || 'タイトルなし'}
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex-none flex items-center">
                <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
