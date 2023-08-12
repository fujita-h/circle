'use client';

import { ChevronRightIcon, UserIcon } from '@heroicons/react/20/solid';
import { capitalize, classNames } from '@/utils';
import Link from 'next/link';
import { BackendImage } from '@/components/backend-image';
import { SomeRequired, Membership } from '@/types';

export function MemberList({ members }: { members: SomeRequired<Membership, 'User'>[] }) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {members.map((member) => (
        <li key={member.User.id} className="relative flex justify-between gap-x-6 px-4 py-3 hover:bg-gray-50 sm:px-6 lg:px-8">
          <div className="flex gap-x-4">
            <BackendImage
              src={`/users/${member.User.id}/photo`}
              className="h-12 w-12 rounded-full bg-gray-50"
              alt="user-icon"
              fallback={<UserIcon className="h-12 w-12 rounded-full bg-gray-100 text-gray-400" />}
            />
            <div className="min-w-0 flex-auto">
              <div className="text-sm">@{member.User.handle}</div>
              <div className="text-base font-semibold leading-6 text-gray-900">
                <Link href={`/u/${member.User.handle}`}>
                  <span className="absolute inset-x-0 -top-px bottom-0" />
                  {member.User.name}
                </Link>
                {member.role === 'ADMIN' ? (
                  <span className="text-sm text-red-800 border border-red-800 rounded-md ml-2 px-1  font-normal">
                    {capitalize(member.role)}
                  </span>
                ) : (
                  <></>
                )}
              </div>
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
