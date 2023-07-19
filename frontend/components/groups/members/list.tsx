'use client';

import { ChevronRightIcon, UserIcon } from '@heroicons/react/20/solid';
import { capitalize, classNames } from '@/utils';
import Link from 'next/link';
import { BackendImage } from '@/components/backend-image';

type MemberData = {
  userId: string;
  groupId: string;
  role: string;
  user: {
    id: string;
    oid: string;
    handle: string;
    name: string;
  };
};

export function MemberList({ members }: { members: MemberData[] }) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {members.map((member) => (
        <li key={member.user.id} className="relative flex justify-between gap-x-6 px-4 py-3 hover:bg-gray-50 sm:px-6 lg:px-8">
          <div className="flex gap-x-4">
            <BackendImage
              src={`/users/${member.user.id}/photo`}
              className="h-12 w-12 rounded-full bg-gray-50"
              alt="user-icon"
              fallback={<UserIcon className="h-12 w-12 rounded-full bg-gray-100 text-gray-400" />}
            />
            <div className="min-w-0 flex-auto">
              <div className="text-sm">@{member.user.handle}</div>
              <div className="text-base font-semibold leading-6 text-gray-900">
                <Link href={`/u/${member.user.handle}`}>
                  <span className="absolute inset-x-0 -top-px bottom-0" />
                  {member.user.name}
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
