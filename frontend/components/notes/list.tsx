'use client';

import { BackendImage } from '@/components/backend-image';
import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { Note, SomeRequired } from '@/types';
import { useAccount, useMsal } from '@azure/msal-react';
import { ChevronRightIcon, UserIcon } from '@heroicons/react/20/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import useSWR from 'swr';
import { StockButton } from './buttons';
import { classNames } from '@/utils';

export function List({ notes }: { notes: SomeRequired<Note, 'User'>[] }) {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {notes.map((note) => {
        const pulishedAt = note.publishedAt
          ? new Date(note.publishedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
          : '不明な日時';
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
                  <Link className="z-10 hover:underline" href={`/users/${note.User.handle}`}>
                    <span>@{note.User.handle}</span>
                  </Link>
                  {note.User.name ? <span>({note.User.name})</span> : <></>}
                </div>
                <div className="text-sm">{pulishedAt}</div>
                <div className="text-xl font-semibold leading-6 text-gray-900">
                  <Link className="hover:underline" href={`/notes/${note.id}`}>
                    <span className="absolute inset-x-0 -top-px bottom-0" />
                    {note.title || 'タイトルなし'}
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

export function CardList({
  notes,
  isGroupList = false,
  forceSingleCols = false,
}: {
  notes: SomeRequired<Note, 'User'>[];
  isGroupList?: boolean;
  forceSingleCols?: boolean;
}) {
  return (
    <ul role="list" className={classNames('grid', forceSingleCols ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8')}>
      {notes.map((note) => {
        const pulishedAt = note.publishedAt
          ? new Date(note.publishedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
          : '不明な日時';
        return (
          <li key={note.id} className="relative col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
            <div className="p-3 flex gap-x-2">
              <div className="w-16 h-16 flex items-center justify-center flex-none">
                {note.Group && !isGroupList ? (
                  <div className="relative pr-1">
                    <BackendImage
                      src={`/groups/${note.Group.id}/photo`}
                      className="h-12 w-12 rounded-md bg-gray-50"
                      alt="user-icon"
                      fallback={<UserIcon className="h-12 w-12 rounded-md bg-gray-100 text-gray-400" />}
                    />
                    <BackendImage
                      src={`/users/${note.User.id}/photo`}
                      className="absolute top-7 left-7 h-8 w-8 rounded-full bg-gray-50"
                      alt="user-icon"
                      fallback={<UserIcon className="h-8 w-8 rounded-full bg-gray-100 text-gray-400" />}
                    />
                  </div>
                ) : (
                  <BackendImage
                    src={`/users/${note.User.id}/photo`}
                    className="h-14 w-14 rounded-full bg-gray-50"
                    alt="user-icon"
                    fallback={<UserIcon className="h-14 w-14 rounded-full bg-gray-100 text-gray-400" />}
                  />
                )}
              </div>
              <div className="min-w-0 flex-auto">
                <div className="text-xl font-semibold leading-6 text-gray-900 mb-1">
                  <Link className="hover:underline" href={`/notes/${note.id}`}>
                    <span className="absolute inset-x-0 -top-px bottom-0" />
                    <span className="break-words">{note.title || 'タイトルなし'}</span>
                  </Link>
                </div>
                <div className="text-sm flex gap-x-2">
                  <div className="z-10">
                    <Link className=" hover:underline" href={`/users/${note.User.handle}`}>
                      <span>@{note.User.handle}</span>
                      {note.User.name ? <span> ({note.User.name})</span> : <></>}
                    </Link>
                    {note.Group && !isGroupList ? (
                      <span>
                        <span> in </span>
                        <Link className=" hover:underline" href={`/groups/${note.Group.handle}`}>
                          {note.Group.name || note.Group.handle}
                        </Link>
                      </span>
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <span>{pulishedAt}</span>{' '}
                  {note._count ? (
                    <span>
                      <HeartIcon className="inline-block -mt-0.5 w-4 text-gray-500" /> {note._count.Liked || 0}
                    </span>
                  ) : (
                    <LikedCount id={note.id} />
                  )}
                </div>
              </div>
              <div className="flex items-end">
                <StockButton noteId={note.id} showCounter={false} showRing={false} popoverDirection="left" />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function LikedCount({ id }: { id: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const jsonFetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const { data: liked, isLoading } = useSWR<{ liked: any; count: number }>(
    `${environment.BACKEND_ENDPOINT}/user/liked/notes/${id}`,
    jsonFetcher,
    {
      revalidateOnFocus: false,
    },
  );

  if (isLoading || !liked) {
    return <></>;
  }

  return (
    <span>
      <HeartIcon className="inline-block -mt-0.5 w-4 text-gray-500" /> {liked.count || 0}
    </span>
  );
}
