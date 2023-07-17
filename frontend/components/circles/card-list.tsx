'use client';
import { ChevronRightIcon, UserGroupIcon } from '@heroicons/react/20/solid';
import { BackendImage } from '@/components/backend-image';
import { ReadNotePermissionBadge, WriteNotePermissionBadge, WriteNoteConditionBadge, JoinCircleConditionBadge } from './badges';
import Link from 'next/link';

type CircleData = {
  id: string;
  name: string;
  handle: string;
  description: string;
  imageUrl: string;
  readNotePermission: string;
  writeNotePermission: string;
  writeNoteCondition: string;
  joinCircleCondition: string;
};

export function CardList({ circles }: { circles: CircleData[] }) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {circles.map((circle) => (
        <li key={circle.id} className="relative flex justify-between gap-x-6 px-4 py-3 hover:bg-gray-50 sm:px-6 lg:px-8">
          <div className="flex gap-x-4">
            <BackendImage
              src={`/circles/${circle.id}/photo`}
              className="h-16 w-16 flex-none rounded-md bg-gray-50"
              alt="circle-icon"
              fallback={<UserGroupIcon className="h-16 w-16 flex-none rounded-lg text-gray-300 bg-gray-50" />}
            />
            <div className="min-w-0 flex-auto">
              <div className="flex flex-wrap gap-2">
                <ReadNotePermissionBadge permission={circle.readNotePermission} />
                <WriteNotePermissionBadge permission={circle.writeNotePermission} />
                <WriteNoteConditionBadge condition={circle.writeNoteCondition} />
                <JoinCircleConditionBadge condition={circle.joinCircleCondition} />
              </div>
              <p className="text-sm font-semibold leading-6 text-gray-900">
                <Link href={`/c/${circle.handle}`}>
                  <span className="absolute inset-x-0 -top-px bottom-0" />
                  {circle.name}
                </Link>
              </p>
              <p className="text-xs leading-5 text-gray-500 line-clamp-1">{circle.description}</p>
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
