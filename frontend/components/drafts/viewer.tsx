'use client';

import { BackendImage } from '@/components/backend-image';
import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { apiRequest } from '@/components/msal/requests';
import { Parser } from '@/components/react-markdown/parser';
import mdStyles from '@/components/react-markdown/styles.module.css';
import { Note } from '@/types';
import { useAccount, useMsal } from '@azure/msal-react';
import { Dialog, Transition } from '@headlessui/react';
import { UserGroupIcon } from '@heroicons/react/20/solid';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { Fragment, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

export function Viewer({ noteId }: { noteId: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const jsonCredFetcher = swrMsalTokenFetcher(instance, account, environment, 'json', 'include');
  const { data: token, isLoading: isTokenLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/user/token`, jsonCredFetcher);
  const jsonFetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const { data: draft, isLoading: isDraftLoading } = useSWR<Note>(`${environment.BACKEND_ENDPOINT}/drafts/${noteId}`, jsonFetcher, {
    revalidateOnFocus: false,
  });
  const [removeModalOpen, setRemoveModalOpen] = useState(false);

  if (isTokenLoading || isDraftLoading) {
    return <div>loading...</div>;
  }

  if (!draft) {
    return <div>No Item</div>;
  }

  const updatedAt = new Date(draft.createdAt).toLocaleString('ja-jp', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  return (
    <div className="px-2 py-2">
      <div className="flex">
        <div className="flex-1">
          {draft.Group ? (
            <div className="flex items-center gap-2">
              <BackendImage
                src={`/groups/${draft.Group.id}/photo`}
                className="h-8 w-8 flex-none rounded-md bg-gray-50"
                alt="group-icon"
                fallback={<UserGroupIcon className="h-8 w-8 flex-none rounded-lg text-gray-300 bg-gray-50" />}
              />
              <p className="text-lg">{draft.Group.name}</p>
            </div>
          ) : (
            <p className="text-lg ml-2">グループの設定はありません</p>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <Link href={`/drafts/${draft.id}/edit`}>
            <div className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 hover:cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              編集する
            </div>
          </Link>
          <div
            className="hover:cursor-pointer"
            onClick={() => {
              setRemoveModalOpen(true);
            }}
          >
            <div className="ml-3 inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 hover:cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
              削除する
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 mx-2 text-lg">{updatedAt} に更新</div>
      <div className="mt-4 mx-2 text-xl font-bold">{draft.title}</div>
      <div className="mt-4 border rounded-md p-4 border-gray-300 bg-white">
        <Parser addHeaderAnchor={true} className={mdStyles.note}>
          {draft.body}
        </Parser>
      </div>
      <RemoveModal open={removeModalOpen} setOpen={setRemoveModalOpen} draft={draft} />
    </div>
  );
}

function RemoveModal({ open, setOpen, draft }: { open: boolean; setOpen: (open: boolean) => void; draft: Note }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const { mutate } = useSWRConfig();

  const cancelButtonRef = useRef(null);

  const handleDelete = async () => {
    if (!account) return;
    const auth = await instance.acquireTokenSilent({
      account,
      scopes: apiRequest(environment).scopes,
    });
    const response = await fetch(`${environment.BACKEND_ENDPOINT}/drafts/${draft.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });
    if (response.ok) {
      mutate((key) => typeof key === 'string' && key.startsWith(`${environment.BACKEND_ENDPOINT}/drafts`));
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
                      下書きの削除
                    </Dialog.Title>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        下書き <span className="font-semibold text-gray-900">{draft.title || 'タイトルなし'}</span>{' '}
                        を削除しようとしています。この操作は取り消せません。
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 disabled:bg-red-200 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                    onClick={() => handleDelete()}
                  >
                    この下書きを削除する
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
