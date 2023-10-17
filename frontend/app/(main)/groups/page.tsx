'use client';

import { useEnvironment } from '@/components/environment/providers';
import { apiRequest } from '@/components/msal/requests';
import { useAccount, useMsal } from '@azure/msal-react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { Inter } from 'next/font/google';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import { Loader } from './loader';

const inter = Inter({ subsets: ['latin'] });

export default function Page() {
  // path and pagination data
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const page = Number(pageParam) ? (Number(pageParam) > 0 ? Number(pageParam) : 1) : 1;

  return (
    <div className="bg-slate-100 print:bg-white border-t border-gray-200">
      <div className="max-w-screen-2xl mx-auto">
        <div className="p-4 md:p-8">
          <div className="px-4">
            <div className="flex items-center">
              <div className="flex-1 ml-1">
                <p className={clsx(inter.className, 'text-3xl font-bold')}>Groups</p>
                <p className="text-base text-gray-500">全てのグループ</p>
              </div>
              <div className="flex-none">
                <CreateGroupSliderButton />
              </div>
            </div>
            <div className="mt-6">
              <Loader pathname={pathname} page={page} take={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FormType {
  handle: string;
  name: string;
  description: string;
}

function CreateGroupSliderButton() {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const router = useRouter();
  const [sliderOpen, setSliderOpen] = useState(false);
  const [form, setForm] = useState<FormType>({ handle: '', name: '', description: '' });
  const [formLocked, setFormLocked] = useState(false);
  const [buttonLocked, setButtonLocked] = useState(true);
  const [failedMessage, setFailedMessage] = useState('');

  useEffect(() => {
    if (!form.handle || !form.name) {
      setButtonLocked(true);
    } else {
      setButtonLocked(false);
    }
  }, [form]);

  const resetForm = () => {
    setForm({ handle: '', name: '', description: '' });
  };

  const handleSliderOpen = (value: boolean) => {
    setSliderOpen(value);
    if (!value) {
      resetForm();
      setFailedMessage('');
    }
  };

  const handleSubmit = async () => {
    setFailedMessage('');
    if (!account) return;
    if (!form.handle || !form.name) return;
    setFormLocked(true);
    try {
      const auth = await instance.acquireTokenSilent({
        account,
        scopes: apiRequest(environment).scopes,
      });
      const response = await fetch(`${environment.BACKEND_ENDPOINT}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ ...form }),
      });
      if (response.ok) {
        const data = await response.json();
        router.push(`/groups/${data.handle}/settings`);
      } else {
        const data = await response.json();
        setFailedMessage(data.error);
      }
    } catch (e) {
      console.error(e);
      setFailedMessage('グループの作成に失敗しました。');
    } finally {
      setFormLocked(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        onClick={() => handleSliderOpen(true)}
      >
        グループの作成
      </button>

      {/* Slider for Create Group */}
      <Transition.Root show={sliderOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => {
            handleSliderOpen(false);
          }}
        >
          <div className="fixed inset-0" />

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-lg">
                    <form className="flex pt-16 h-full flex-col divide-y divide-gray-200 bg-white shadow-xl">
                      <div className="h-0 flex-1 overflow-y-auto">
                        <div className="bg-indigo-700 px-4 py-6 sm:px-6">
                          <div className="flex items-center justify-between">
                            <Dialog.Title className="text-base font-semibold leading-6 text-white">グループの作成</Dialog.Title>
                            <div className="ml-3 flex h-7 items-center">
                              <button
                                type="button"
                                className="rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                                onClick={() => handleSliderOpen(false)}
                              >
                                <span className="sr-only">Close panel</span>
                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-1">
                            <p className="text-sm text-indigo-300"> 新たなグループを作成して、情報の共有を始めましょう</p>
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div className="divide-y divide-gray-200 px-4 sm:px-6">
                            <div className="space-y-6 pb-5 pt-6">
                              <div>
                                <label htmlFor="group-handle" className="block text-sm font-medium leading-6 text-gray-900">
                                  グループのURL
                                </label>
                                <div className="mt-2">
                                  <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                                    <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">{`${location.origin}/`}</span>
                                    <input
                                      type="text"
                                      name="group-handle"
                                      id="group-handle"
                                      className="block flex-1 border-0 bg-transparent py-1.5 pl-0.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                                      placeholder="new-group"
                                      disabled={formLocked}
                                      value={form.handle}
                                      onChange={(e) => setForm({ ...form, handle: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <div className="ml-3 mt-1">
                                  <span className="text-sm text-gray-500">
                                    アルファベット、数字、ハイフンのみが使用できます。大文字と小文字は区別されません。また、すでに利用されている文字列は使用できません。
                                  </span>
                                </div>
                              </div>
                              <div>
                                <label htmlFor="group-name" className="block text-sm font-medium leading-6 text-gray-900">
                                  グループ名
                                </label>
                                <div className="mt-2">
                                  <input
                                    type="text"
                                    name="group-name"
                                    id="group-name"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    disabled={formLocked}
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div>
                                <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                                  グループの説明
                                </label>
                                <div className="mt-2">
                                  <textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    disabled={formLocked}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="pb-6 pt-4">
                              <div className="flex text-sm">
                                <span className="group inline-flex items-center text-gray-500 hover:text-gray-900">
                                  <ExclamationCircleIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                                  <span className="ml-2">詳細な設定は、グループの作成後に設定できます。</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        {failedMessage ? (
                          <div className="px-2 pt-4">
                            <FailedAlert message={failedMessage} />
                          </div>
                        ) : (
                          <></>
                        )}
                        <div className="flex flex-shrink-0 justify-end px-4 py-4">
                          <button
                            type="button"
                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            onClick={() => handleSliderOpen(false)}
                          >
                            キャンセル
                          </button>
                          <button
                            type="button"
                            className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm disabled:bg-indigo-200 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            onClick={handleSubmit}
                            disabled={buttonLocked}
                          >
                            グループを作成する
                          </button>
                        </div>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}

function FailedAlert({ message }: { message?: string }) {
  return (
    <div className="rounded-md bg-red-100 p-2">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="mx-3">
          <p className="text-sm font-medium text-red-800">{message}</p>
        </div>
      </div>
    </div>
  );
}
