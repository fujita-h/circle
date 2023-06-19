'use client';

import { useEnvironment } from '@/components/environment/providers';
import { apiRequest } from '@/components/msal/requests';
import { useAccount, useMsal } from '@azure/msal-react';
import { ChangeEvent, useState } from 'react';
import useSWR from 'swr';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';

export function UpdateProfileForm() {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [formUpdates, setFormUpdates] = useState({});
  const [formLocked, setFormLocked] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [failedMessage, setFailedMessage] = useState('');

  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data, mutate } = useSWR(`${environment.BACKEND_ENDPOINT}/user`, fetcher, {
    revalidateOnFocus: false,
  });

  const handleClick = async () => {
    setSuccessMessage('');
    setFailedMessage('');
    if (account) {
      try {
        setFormLocked(true);
        const auth = await instance.acquireTokenSilent({
          account,
          scopes: apiRequest(environment).scopes,
        });
        const response = await fetch(`${environment.BACKEND_ENDPOINT}/user`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.accessToken}`,
          },
          body: JSON.stringify({ ...formUpdates }),
        });
        if (response.ok) {
          setSuccessMessage('更新が完了しました');
          setFormUpdates({});
          mutate();
        } else {
          setFailedMessage('更新に失敗しました');
        }
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          setFailedMessage(e.message);
        } else if (typeof e === 'string') {
          setFailedMessage(e);
        } else {
          setFailedMessage('不明なエラー');
        }
      } finally {
        setFormLocked(false);
      }
    } else {
      setFailedMessage('認証エラー');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSuccessMessage('');
    setFailedMessage('');
    setFormUpdates({ ...formUpdates, [e.target.name]: e.target.value });
  };

  return (
    <>
      <div className="md:col-span-2">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
          <div className="col-span-full">
            <label htmlFor="handle" className="block text-sm font-medium leading-6 text-gray-900">
              Handle name
            </label>
            <div className="mt-2">
              <div className="mt-2">
                <input
                  type="text"
                  name="handle"
                  id="handle"
                  autoComplete="username"
                  defaultValue={data?.handle}
                  disabled={formLocked}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-slate-400/40 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="col-span-full">
            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
              Name
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="name"
                id="name"
                autoComplete="name"
                defaultValue={data?.name}
                disabled={formLocked}
                onChange={handleInputChange}
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-slate-400/40 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="col-span-full">
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={data?.email}
                disabled={formLocked}
                onChange={handleInputChange}
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-slate-400/40 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex space-x-4">
          <div>
            <button
              type="button"
              disabled={formLocked || Object.keys(formUpdates).length === 0}
              onClick={handleClick}
              className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:bg-opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
          {successMessage ? <SuccessAlert message={successMessage} /> : <></>}
          {failedMessage ? <FailedAlert message={failedMessage} /> : <></>}
        </div>
      </div>
    </>
  );
}

function SuccessAlert({ message }: { message?: string }) {
  return (
    <div className="rounded-md bg-green-100 p-2">
      <div className="flex">
        <div className="flex-shrink-0">
          <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
        </div>
        <div className="mx-3">
          <p className="text-sm font-medium text-green-800">{message}</p>
        </div>
      </div>
    </div>
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
