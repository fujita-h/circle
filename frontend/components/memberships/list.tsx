'use client';

import { BackendImage } from '@/components/backend-image';
import { useEnvironment } from '@/components/environment/providers';
import { apiRequest } from '@/components/msal/requests';
import { Membership, SomeRequired } from '@/types';
import { useAccount, useMsal } from '@azure/msal-react';
import { Dialog, Listbox, Popover, Transition } from '@headlessui/react';
import {
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  CheckIcon,
  ChevronUpDownIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Fragment, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

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
            <div className="absolute z-10 top-0 left-0">
              <AdminMenu membership={member} />
            </div>
          ) : (
            <></>
          )}
          <Link href={`/users/${member.User.handle}`} className="group relative">
            <div className="flex flex-1 flex-col p-6">
              <BackendImage
                src={`/users/${member.User.id}/photo`}
                className="mx-auto h-32 w-32 flex-shrink-0 rounded-full bg-gray-50 group-hover:ring-1 group-hover:ring-gray-300"
                alt="user-icon"
                fallback={<UserIcon className="mx-auto h-32 w-32 flex-shrink-0 rounded-full bg-gray-100 text-gray-400" />}
              />
              <div className="mt-6">
                <div className={clsx('text-sm text-gray-600 group-hover:underline', inter.className)}>@{member.User.handle}</div>
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

function AdminMenu({ membership }: { membership: SomeRequired<Membership, 'User'> }) {
  const [UpdateRoleModalOpen, setUpdateRoleModalOpen] = useState(false);
  const [RemoveMemberModalOpen, setRemoveMemberModalOpen] = useState(false);
  return (
    <>
      <Popover className="relative z-10">
        <Popover.Button as="div" className="m-2 p-1 group hover:cursor-pointer">
          <EllipsisHorizontalIcon className="h-6 w-6 text-gray-400 ring-1 ring-gray-300 rounded-full hover:text-gray-500 group-hover:ring-2 group-hover:cursor-pointer" />
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
          <Popover.Panel className="absolute top-9 left-3 w-48">
            <div className="bg-white p-2 ring-1 ring-gray-300 rounded-md">
              <div className="flex flex-col gap-1">
                <>
                  <div
                    className="flex items-center px-2 py-1 rounded-md hover:cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setUpdateRoleModalOpen(true);
                    }}
                  >
                    <ArrowsRightLeftIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                    ロールを変更する
                  </div>

                  <div
                    className="flex items-center px-2 py-1 rounded-md hover:cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setRemoveMemberModalOpen(true);
                    }}
                  >
                    <TrashIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                    メンバーから外す
                  </div>
                </>
              </div>
            </div>
          </Popover.Panel>
        </Transition>
      </Popover>
      <UpdateRoleModal open={UpdateRoleModalOpen} setOpen={setUpdateRoleModalOpen} membership={membership} />
      <RemoveMemberModal open={RemoveMemberModalOpen} setOpen={setRemoveMemberModalOpen} membership={membership} />
    </>
  );
}

const roles = [
  { role: 'MEMBER', name: 'Member', text: '一般ユーザー' },
  { role: 'ADMIN', name: 'Admin', text: '管理ユーザー' },
];

function UpdateRoleModal({
  open,
  setOpen,
  membership,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  membership: SomeRequired<Membership, 'User'>;
}) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const { mutate } = useSWRConfig();

  const cancelButtonRef = useRef(null);
  const [selected, setSelected] = useState(roles.find((role) => role.role === membership.role) || roles[0]);
  const [confirmation, setConfirmation] = useState(false);
  const currentRoleName = membership.role === 'PENDING_APPROVAL' ? '承認待ち' : membership.role.toLowerCase();

  const handleUpdate = async () => {
    if (!account) return;
    const auth = await instance.acquireTokenSilent({
      account,
      scopes: apiRequest(environment).scopes,
    });
    const response = await fetch(`${environment.BACKEND_ENDPOINT}/groups/${membership.groupId}/members/${membership.userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({
        role: selected.role,
      }),
    });
    if (response.ok) {
      mutate((key) => typeof key === 'string' && key.startsWith(`${environment.BACKEND_ENDPOINT}/groups/${membership.groupId}/members`));
      setOpen(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <ArrowsRightLeftIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h1" className="text-xl font-semibold leading-6 text-gray-900">
                      ロールの変更
                    </Dialog.Title>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        ユーザー <span className="font-semibold text-gray-900">{membership.User.name}</span>
                        {' ('}
                        <span className="font-semibold text-gray-600">@{membership.User.handle}</span>
                        {') '}
                        のロールを変更しようとしています。現在のロールは{' '}
                        <span className="font-semibold text-gray-900 capitalize">{currentRoleName}</span> です。
                      </p>
                    </div>

                    <div className="mt-4 mx-4 md:mx-8">
                      <div className="flex flex-col sm:flex-row justify-center items-center sm:items-baseline sm:gap-4">
                        <div className="flex-none text-base">設定するロール</div>
                        <div className="flex-1">
                          <Listbox
                            value={selected}
                            onChange={(e) => {
                              setSelected(e);
                              setConfirmation(false);
                            }}
                          >
                            {({ open }) => (
                              <>
                                <div className="relative mt-2">
                                  <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
                                    <span className="inline-flex w-full truncate">
                                      <span className="truncate">{selected.name}</span>
                                      <span className="ml-2 truncate text-gray-500">{selected.text}</span>
                                    </span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </span>
                                  </Listbox.Button>

                                  <Transition
                                    show={open}
                                    as={Fragment}
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                  >
                                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                      {roles.map((role) => (
                                        <Listbox.Option
                                          key={role.name}
                                          className={({ active }) =>
                                            clsx(
                                              active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                                              'relative cursor-default select-none py-2 pl-3 pr-9',
                                            )
                                          }
                                          value={role}
                                        >
                                          {({ selected, active }) => (
                                            <>
                                              <div className="flex">
                                                <span className={clsx(selected ? 'font-semibold' : 'font-normal', 'truncate')}>
                                                  {role.name}
                                                </span>
                                                <span className={clsx(active ? 'text-indigo-200' : 'text-gray-500', 'ml-2 truncate')}>
                                                  {role.text}
                                                </span>
                                              </div>

                                              {selected ? (
                                                <span
                                                  className={clsx(
                                                    active ? 'text-white' : 'text-indigo-600',
                                                    'absolute inset-y-0 right-0 flex items-center pr-4',
                                                  )}
                                                >
                                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                              ) : null}
                                            </>
                                          )}
                                        </Listbox.Option>
                                      ))}
                                    </Listbox.Options>
                                  </Transition>
                                </div>
                              </>
                            )}
                          </Listbox>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="flex justify-center items-center gap-4">
                        <div className="text-lg font-semibold">
                          <span className="capitalize">{currentRoleName}</span>
                        </div>
                        <div>
                          <ArrowRightIcon className="h-6 w-6 text-gray-600" aria-hidden="true" />
                        </div>
                        <div className="text-lg font-semibold">
                          <span className="capitalize">{selected.role.toLowerCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <fieldset>
                        <legend className="sr-only">Confirmation</legend>
                        <div className="space-y-5">
                          <div className="relative flex items-start">
                            <div className="flex h-6 items-center">
                              <input
                                id="update-confirmation"
                                aria-describedby="update-confirmation"
                                name="candidates"
                                type="checkbox"
                                disabled={selected.role === membership.role}
                                checked={confirmation}
                                onChange={(e) => setConfirmation(e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                              />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                              <label htmlFor="update-confirmation" className="font-medium text-gray-600">
                                内容を確認しました
                              </label>
                            </div>
                          </div>
                        </div>
                      </fieldset>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 disabled:bg-indigo-200 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                    disabled={selected.role === membership.role || !confirmation}
                    onClick={() => handleUpdate()}
                  >
                    ユーザーのロールを変更する
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    onClick={() => setOpen(false)}
                    ref={cancelButtonRef}
                  >
                    キャンセル
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function RemoveMemberModal({
  open,
  setOpen,
  membership,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  membership: SomeRequired<Membership, 'User'>;
}) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const { mutate } = useSWRConfig();

  const cancelButtonRef = useRef(null);
  const [confirmation, setConfirmation] = useState('');

  const handleDelete = async () => {
    if (!account) return;
    const auth = await instance.acquireTokenSilent({
      account,
      scopes: apiRequest(environment).scopes,
    });
    const response = await fetch(`${environment.BACKEND_ENDPOINT}/groups/${membership.groupId}/members/${membership.userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });
    if (response.ok) {
      mutate((key) => typeof key === 'string' && key.startsWith(`${environment.BACKEND_ENDPOINT}/groups/${membership.groupId}/members`));
      setOpen(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h1" className="text-xl font-semibold leading-6 text-gray-900">
                      メンバーから外す
                    </Dialog.Title>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        ユーザー <span className="font-semibold text-gray-900">{membership.User.name}</span>{' '}
                        をメンバーから外そうとしています。この操作は取り消せません。
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 mx-2">
                    <label htmlFor="confirmation-handle-input" className="block text-sm font-medium leading-6 text-gray-900">
                      確認のため、ユーザーのハンドルを入力する必要があります
                    </label>
                    <input
                      type="text"
                      id="confirmation-handle-input"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      placeholder={`@${membership.User.handle} と入力してください`}
                      value={confirmation}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      onChange={(e) => setConfirmation(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 disabled:bg-red-200 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                    disabled={confirmation !== `@${membership.User.handle}`}
                    onClick={() => handleDelete()}
                  >
                    ユーザーをグループから外す
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    onClick={() => setOpen(false)}
                    ref={cancelButtonRef}
                  >
                    キャンセル
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
