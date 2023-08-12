'use client';

import { BackendImage } from '@/components/backend-image';
import { Membership, SomeRequired } from '@/types';
import { UserIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';

export function CardList({ members }: { members: SomeRequired<Membership, 'User'>[] }) {
  return (
    <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {members.map((member) => (
        <li key={member.userId} className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow">
          <Link href={`/u/${member.User.handle}`} className="group">
            <div className="flex flex-1 flex-col p-6">
              <BackendImage
                src={`/users/${member.User.id}/photo`}
                className="mx-auto h-32 w-32 flex-shrink-0 rounded-full bg-gray-50 group-hover:ring-1 group-hover:ring-gray-300"
                alt="user-icon"
                fallback={<UserIcon className="mx-auto h-32 w-32 flex-shrink-0 rounded-full bg-gray-100 text-gray-400" />}
              />
              <h3 className="mt-6 text-base font-medium text-gray-900 group-hover:underline">{member.User.name}</h3>
              <dl className="mt-1 flex flex-grow flex-col justify-between">
                <dt className="sr-only">Title</dt>
                <dd className="text-sm text-gray-500">{''}</dd>
                <dt className="sr-only">Role</dt>
                <dd className="mt-3">
                  {member.role === 'ADMIN' ? (
                    <span className="capitalize inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      {member.role.toLowerCase()}
                    </span>
                  ) : (
                    <></>
                  )}
                </dd>
              </dl>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
