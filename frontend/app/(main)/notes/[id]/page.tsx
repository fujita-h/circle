'use client';

import { BackendImage } from '@/components/backend-image';
import { Comments } from '@/components/comments';
import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { LikeButton, StockButton } from '@/components/notes';
import { Parser } from '@/components/react-markdown/parser';
import { ReactiveToC } from '@/components/react-markdown/reactive-toc';
import mdStyles from '@/components/react-markdown/styles.module.css';
import { Note, SomeRequired, TopicMap } from '@/types';
import { classNames } from '@/utils';
import { useAccount, useMsal } from '@azure/msal-react';
import { Menu, Transition } from '@headlessui/react';
import {
  ArchiveBoxIcon,
  ArrowRightCircleIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  HeartIcon,
  PencilSquareIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon,
  UserPlusIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { Fragment, useEffect } from 'react';
import useSWR from 'swr';

export default function Page({ params }: { params: any }) {
  const id = params.id;
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const jsonCredFetcher = swrMsalTokenFetcher(instance, account, environment, 'json', 'include');
  const { data: token, isLoading: isTokenLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/user/token`, jsonCredFetcher);

  const jsonFetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const {
    data: note,
    error: noteFetchError,
    isLoading: isNoteLoading,
  } = useSWR<SomeRequired<Note, 'User' | 'Group' | 'Topics' | '_count'>>(`${environment.BACKEND_ENDPOINT}/notes/${id}`, jsonFetcher, {
    revalidateOnFocus: false,
  });

  // update document title
  useEffect(() => {
    if (!document) return;
    if (!note) return;
    document.title = `${note.title}`;
    return () => {
      // this calls when component will unmount
      document.title = environment.WEBSITE_NAME;
    };
  }, [note, environment.WEBSITE_NAME]);

  if (isTokenLoading || isNoteLoading) {
    return <div>loading...</div>;
  }

  if (noteFetchError) {
    return <div>no data</div>;
  }

  if (!note) {
    return <div>no data</div>;
  }

  const pulishedAt = note.publishedAt
    ? new Date(note.publishedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
    : '不明な日時';

  return (
    <div>
      {note.Group ? (
        <div className="py-4 bg-white border-t border-gray-200">
          <div className="max-w-screen-2xl mx-auto">
            <div className="px-4 lg:px-8">
              <Link href={`/groups/${note.Group.handle}`}>
                <div className="flex items-center">
                  <BackendImage
                    src={`/groups/${note.Group.id}/photo`}
                    className="w-10 h-10 rounded-md"
                    alt="group icon"
                    fallback={<UserGroupIcon className="w-10 h-10 rounded-md bg-gray-100 text-gray-400 ring-1 ring-gray-200" />}
                  />
                  <div className="ml-3 text-xl font-bold text-gray-900 hover:text-gray-500 hover:underline">{note.Group.name} </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
      <div className="bg-slate-100 print:bg-white border-t border-gray-200">
        <div className="max-w-screen-2xl mx-auto">
          <div className="p-4 md:p-8">
            <div className="flex space-x-1 mb-6">
              <div className="order-0 hidden md:block w-12 print:hidden"></div>
              <div className="order-1 flex-1">
                <div className="space-y-1 sm:space-y-2 mx-4">
                  <div id="note_title" className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
                    {note.title || 'タイトルなし'}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {note.Topics.map((tm: TopicMap) => (
                      <div
                        key={tm.topicId}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white ring-1 shadow-sm ring-gray-300 rounded-md"
                      >
                        <div className="flex-shrink-0">
                          <BackendImage
                            src={`/topics/${tm.Topic?.id}/photo`}
                            className="w-6 h-6 rounded-full"
                            alt="topic icon"
                            fallback={<></>}
                          />
                        </div>
                        <div className="flex-none text-base text-gray-900">{tm.Topic?.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="order-0 hidden md:block w-12 print:hidden">
                <div></div>
                <div className="sticky top-0">
                  <div className="pt-5 flex flex-col gap-4">
                    <LikeButton noteId={note.id} />
                    <StockButton noteId={note.id} />
                    <div className="w-10 h-10 flex items-center justify-center">
                      <OtherMenuButton note={note} className="w-8 h-8 text-gray-700" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-2 hidden lg:block w-80 print:hidden">
                <div>
                  <div className="rounded-md bg-white ring-1 ring-gray-200 p-4 flex flex-col divide-y divide-gray-300 ">
                    <div className="pb-2">
                      <div className="mx-2">
                        <div className="text-gray-800">{pulishedAt} に公開</div>
                      </div>
                    </div>
                    {note.Group ? (
                      <div className="py-2">
                        <div className="inline-block py-1 px-2 rounded-md bg-white ring-1 ring-gray-200">
                          <div className="mx-2 flex space-x-2 items-center">
                            <div>
                              <BackendImage
                                src={`/groups/${note.Group.id}/photo`}
                                className="w-5 h-5 rounded-md"
                                alt="group icon"
                                fallback={<UserGroupIcon className="w-8 h-8 rounded-md bg-gray-100 text-gray-400 ring-1 ring-gray-200" />}
                              />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-800">{note.Group.name}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}
                    <div className="pt-2">
                      <div className="mx-1 flex space-x-2 items-center">
                        <div>
                          <BackendImage
                            src={`/users/${note.User.id}/photo`}
                            className="w-10 h-10 rounded-full"
                            alt="user icon"
                            fallback={<UserIcon className="w-10 h-10 rounded-full bg-gray-100 text-gray-400" />}
                          />
                        </div>
                        <div>
                          <div className="text-sm text-gray-700">@{note.User.handle}</div>
                          <div className="text-base font-bold text-gray-900">{note.User.name}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sticky top-0">
                  <div className="pt-5">
                    <ReactiveToC>{note.body}</ReactiveToC>
                  </div>
                </div>
              </div>
              <div className="order-1 flex-1">
                <div className="bg-white rounded-md ring-1 ring-gray-200 p-4 lg:p-5">
                  <div>
                    <Parser addHeaderAnchor={true} className={mdStyles.note}>
                      {note.body}
                    </Parser>
                  </div>
                </div>
                <div className="rounded-md ring-1 ring-gray-200 my-8 p-4 bg-white">
                  <Comments noteId={note.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OtherMenuButton({ note, className }: { note: any; className?: string }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="">
          <EllipsisHorizontalIcon className={className} />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href={`/notes/${note.id}/edit`}
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'group flex items-center px-4 py-2 text-sm',
                  )}
                >
                  <PencilSquareIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                  Edit
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'group flex items-center px-4 py-2 text-sm',
                  )}
                >
                  <DocumentDuplicateIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                  Duplicate
                </a>
              )}
            </Menu.Item>
          </div>
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'group flex items-center px-4 py-2 text-sm',
                  )}
                >
                  <ArchiveBoxIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                  Archive
                </a>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'group flex items-center px-4 py-2 text-sm',
                  )}
                >
                  <ArrowRightCircleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                  Move
                </a>
              )}
            </Menu.Item>
          </div>
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'group flex items-center px-4 py-2 text-sm',
                  )}
                >
                  <UserPlusIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                  Share
                </a>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'group flex items-center px-4 py-2 text-sm',
                  )}
                >
                  <HeartIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                  Add to favorites
                </a>
              )}
            </Menu.Item>
          </div>
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'group flex items-center px-4 py-2 text-sm',
                  )}
                >
                  <TrashIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                  Delete
                </a>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
