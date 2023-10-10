'use client';

import { BackendImage } from '@/components/backend-image';
import { Topic } from '@/types';
import { classNames } from '@/utils';
import { TagIcon } from '@heroicons/react/20/solid';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export function CardList({ topics }: { topics: Topic[] }) {
  return (
    <ul role="list" className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {topics.map((topic) => (
        <li key={topic.id} className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow">
          <Link href={`/topics/${topic.handle}`} className="group">
            <div className="flex flex-1 flex-col px-2 py-6">
              <BackendImage
                src={`/topics/${topic.id}/photo`}
                className="mx-auto h-16 w-16 flex-shrink-0 rounded-full bg-gray-50 group-hover:ring-1 group-hover:ring-gray-300"
                alt="user-icon"
                fallback={<TagIcon className="mx-auto h-16 w-16 flex-shrink-0 rounded-full bg-gray-100 text-gray-400" />}
              />
              <div className="mt-4">
                <div className="text-base font-medium text-gray-900 group-hover:underline">{topic.name}</div>
                <div className={classNames('text-sm text-gray-600 group-hover:underline', inter.className)}>{topic.handle}</div>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
