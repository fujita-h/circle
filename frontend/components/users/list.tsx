'use client';

import { BackendImage } from '@/components/backend-image';
import { User } from '@/types';
import { classNames } from '@/utils';
import { UserIcon } from '@heroicons/react/20/solid';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export function CardList({ users }: { users: User[] }) {
  return (
    <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {users.map((user) => (
        <li key={user.id} className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow">
          <Link href={`/users/${user.handle}`} className="group">
            <div className="flex flex-1 flex-col p-6">
              <BackendImage
                src={`/users/${user.id}/photo`}
                className="mx-auto h-32 w-32 flex-shrink-0 rounded-full bg-gray-50 group-hover:ring-1 group-hover:ring-gray-300"
                alt="user-icon"
                fallback={<UserIcon className="mx-auto h-32 w-32 flex-shrink-0 rounded-full bg-gray-100 text-gray-400" />}
              />
              <div className="mt-6">
                <div className={classNames('text-sm text-gray-600 group-hover:underline', inter.className)}>@{user.handle}</div>
                <div className="text-base font-medium text-gray-900 group-hover:underline">{user.name}</div>
                <dl className="mt-1 flex flex-grow flex-col justify-between">
                  <dt className="sr-only">Title</dt>
                  <dd className="text-sm text-gray-500">{''}</dd>
                </dl>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
