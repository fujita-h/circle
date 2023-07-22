'use client';

import { ChevronRightIcon, UserIcon, UserGroupIcon } from '@heroicons/react/20/solid';
import { BackendImage } from '@/components/backend-image';
import Link from 'next/link';
import { SomeRequired, Note } from '@/types';

export function List({ notes }: { notes: SomeRequired<Note, 'User'>[] }) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {notes.map((note) => {
        const createdAt = new Date(note.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
        const updatedAt = new Date(note.updatedAt);
        return (
          <li key={note.id} className="relative flex justify-between gap-x-6 px-4 py-3 hover:bg-gray-50 sm:px-6 lg:px-8">
            <div className="flex gap-x-2">
              <BackendImage
                src={`/users/${note.User.id}/photo`}
                className="h-8 w-8 rounded-full bg-gray-50"
                alt="user-icon"
                fallback={<UserIcon className="h-8 w-8 rounded-full bg-gray-100 text-gray-400" />}
              />

              <div className="min-w-0 flex-auto">
                <div className="text-sm flex gap-x-2">
                  <Link className="z-10 hover:underline" href={`/u/${note.User.handle}`}>
                    <span>@{note.User.handle}</span>
                  </Link>
                  {note.User.name ? <span>({note.User.name})</span> : <></>}
                </div>
                <div className="text-sm">{createdAt}</div>
                <div className="text-xl font-semibold leading-6 text-gray-900">
                  <Link className="hover:underline" href={`/notes/${note.id}`}>
                    <span className="absolute inset-x-0 -top-px bottom-0" />
                    {note.title}
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-x-4">
              <div className="hidden sm:flex sm:flex-col sm:items-end">{/* somthing to right */}</div>
              <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
