'use client';

import { BackendImage } from '@/components/backend-image';
import { Membership, MembershipRole, SomeRequired } from '@/types';
import { classNames } from '@/utils';
import { Menu, Popover, Transition } from '@headlessui/react';
import {
  ArchiveBoxIcon,
  ArrowRightCircleIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  HeartIcon,
  PencilSquareIcon,
  TrashIcon,
  UserIcon,
  UserPlusIcon,
} from '@heroicons/react/24/solid';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Fragment } from 'react';

const inter = Inter({ subsets: ['latin'] });

export function CardList({ members, showAdminMenu = false }: { members: SomeRequired<Membership, 'User'>[]; showAdminMenu?: boolean }) {
  return (
    <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {members.map((member) => (
        <li
          key={member.userId}
          className="relative col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow"
        >
          {showAdminMenu ? (
            <div className="absolute z-10 top-2 left-2">
              <AdminMenu member={member} />
            </div>
          ) : (
            <></>
          )}
          <Link href={`/u/${member.User.handle}`} className="group relative">
            <div className="flex flex-1 flex-col p-6">
              <BackendImage
                src={`/users/${member.User.id}/photo`}
                className="mx-auto h-32 w-32 flex-shrink-0 rounded-full bg-gray-50 group-hover:ring-1 group-hover:ring-gray-300"
                alt="user-icon"
                fallback={<UserIcon className="mx-auto h-32 w-32 flex-shrink-0 rounded-full bg-gray-100 text-gray-400" />}
              />
              <div className="mt-6">
                <div className={classNames('text-sm text-gray-600 group-hover:underline', inter.className)}>@{member.User.handle}</div>
                <div className="text-base font-medium text-gray-900 group-hover:underline">{member.User.name}</div>
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
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AdminMenu({ member }: { member: SomeRequired<Membership, 'User'> }) {
  const role: MembershipRole = member.role;
  return (
    <Popover className="relative z-10">
      <Popover.Button as="div">
        <EllipsisHorizontalIcon className="h-6 w-6 text-gray-400 ring-1 ring-gray-300 rounded-full hover:text-gray-500 hover:ring-2 hover:cursor-pointer" />
      </Popover.Button>
      <Popover.Overlay className="fixed inset-0" />
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Popover.Panel className="absolute top-8 left-0 w-48">
          <div className="bg-white p-2 ring-1 ring-gray-300 rounded-md">
            <div className="flex flex-col gap-1">
              {role === 'ADMIN' ? (
                <>
                  <div className="flex items-center px-2 py-1 rounded-md hover:cursor-pointer hover:bg-gray-100">
                    <DocumentDuplicateIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                    Admin Menu 1
                  </div>
                  <div className="flex items-center px-2 py-1 rounded-md hover:cursor-pointer hover:bg-gray-100">
                    <DocumentDuplicateIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                    Admin Menu 2
                  </div>
                </>
              ) : (
                <></>
              )}
              {role === 'MEMBER' ? (
                <>
                  <div className="flex items-center px-2 py-1 rounded-md hover:cursor-pointer hover:bg-gray-100">
                    <DocumentDuplicateIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                    Member Menu 1
                  </div>
                  <div className="flex items-center px-2 py-1 rounded-md hover:cursor-pointer hover:bg-gray-100">
                    <DocumentDuplicateIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                    Member Menu 2
                  </div>
                </>
              ) : (
                <></>
              )}
              {role === 'PENDING_APPROVAL' ? (
                <>
                  <div className="flex items-center px-2 py-1 rounded-md hover:cursor-pointer hover:bg-gray-100">
                    <DocumentDuplicateIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                    PENDING_APPROVAL Menu 1
                  </div>
                  <div className="flex items-center px-2 py-1 rounded-md hover:cursor-pointer hover:bg-gray-100">
                    <DocumentDuplicateIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                    PENDING_APPROVAL Menu 2
                  </div>
                </>
              ) : (
                <></>
              )}
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}
