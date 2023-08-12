'use client';

import { BackendImage } from '@/components/backend-image';
import { Group } from '@/types';
import { UserGroupIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { JoinGroupConditionBadge, ReadNotePermissionBadge, WriteNoteConditionBadge, WriteNotePermissionBadge } from './badges';

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
