'use client';
import { ChevronRightIcon, UserGroupIcon } from '@heroicons/react/20/solid';
import { BackendImage } from '@/components/backend-image';
import { ReadNotePermissionBadge, WriteNotePermissionBadge, WriteNoteConditionBadge, JoinGroupConditionBadge } from './badges';
import Link from 'next/link';
import { Group, Membership, SomeRequired } from '@/types';

export function List({ groups }: { groups: Group[] }) {
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
              <div className="flex flex-wrap gap-2">
                <ReadNotePermissionBadge permission={group.readNotePermission} />
                <WriteNotePermissionBadge permission={group.writeNotePermission} />
                <WriteNoteConditionBadge condition={group.writeNoteCondition} />
                <JoinGroupConditionBadge condition={group.joinGroupCondition} />
              </div>
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

export function CardList({ groups }: { groups: Group[] }) {
  return (
    <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <li key={group.id} className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
          <Link href={`/g/${group.handle}`} className="group">
            <div className="flex w-full items-center justify-between space-x-6 p-4">
              <div className="flex-1 truncate">
                <div className="flex flex-col items-center space-y-1 m-1">
                  <BackendImage
                    src={`/groups/${group.id}/photo`}
                    className="h-16 w-16 flex-none rounded-md bg-gray-50 group-hover:ring-1 group-hover:ring-gray-300"
                    alt="group-icon"
                    fallback={<UserGroupIcon className="h-16 w-16 flex-none rounded-lg text-gray-300 bg-gray-50" />}
                  />
                  <h3 className="truncate break-all text-base font-medium text-gray-900 group-hover:underline">{group.name}</h3>
                  <div className="flex space-x-2">
                    <ReadNotePermissionBadge permission={group.readNotePermission} />
                    <WriteNotePermissionBadge permission={group.writeNotePermission} />
                    <WriteNoteConditionBadge condition={group.writeNoteCondition} />
                    <JoinGroupConditionBadge condition={group.joinGroupCondition} />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
