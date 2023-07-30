'use client';

import { Fragment, useState } from 'react';
import { Transition, Dialog, Popover } from '@headlessui/react';
import { classNames } from '@/utils';
import useSWR from 'swr';
import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { apiRequest } from '@/components/msal/requests';
import { ArchiveBoxIcon, FolderPlusIcon } from '@heroicons/react/24/solid';
import { Stock } from '@/types';

export function StockButton({
  noteId,
  showCounter = true,
  showRing = true,
  popoverDirection = 'right',
}: {
  noteId: string;
  showCounter?: boolean;
  showRing?: boolean;
  popoverDirection?: 'left' | 'right';
}) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const jsonFetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const {
    data: stockedData,
    isLoading: isStockedLoading,
    mutate: stockDataMutate,
  } = useSWR<{ stocked: Stock[]; count: number }>(`${environment.BACKEND_ENDPOINT}/user/stocked/notes/${noteId}`, jsonFetcher, {
    revalidateOnFocus: false,
  });
  const {
    data: labelData,
    isLoading: isLabelLoading,
    mutate: labelDataMutate,
  } = useSWR<{ data: any[]; meta: { total: number } }>(`${environment.BACKEND_ENDPOINT}/user/stocked/labels`, jsonFetcher, {
    revalidateOnFocus: false,
  });

  const handleStockDefault = async () => {
    if (!account) return;
    const auth = await instance.acquireTokenSilent({
      account,
      scopes: apiRequest(environment).scopes,
    });
    const response = await fetch(`${environment.BACKEND_ENDPOINT}/user/stocked/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });
    if (response.ok) {
      labelDataMutate();
      stockDataMutate();
    }
  };

  const handleStockWithLabel = async (e: any) => {
    const labelId = e.target.name || 'default';
    if (!account) return;
    const auth = await instance.acquireTokenSilent({
      account,
      scopes: apiRequest(environment).scopes,
    });
    const response = await fetch(`${environment.BACKEND_ENDPOINT}/user/stocked/notes/${noteId}/labels/${labelId}`, {
      method: e.target.checked ? 'DELETE' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });
    if (response.ok) {
      stockDataMutate();
    }
  };

  const [newLabel, setNewLabel] = useState('');
  const handleCreateLabel = async (e: any) => {
    e.preventDefault();
    if (!account) return;
    const auth = await instance.acquireTokenSilent({
      account,
      scopes: apiRequest(environment).scopes,
    });
    const response = await fetch(`${environment.BACKEND_ENDPOINT}/user/stocked/labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({ name: newLabel }),
    });
    if (response.ok) {
      setNewLabel('');
      labelDataMutate();
    }
  };

  if (isStockedLoading || isLabelLoading || !stockedData) {
    return <></>;
  }

  return (
    <Popover>
      <div className="relative z-20">
        <div className="flex flex-col w-10">
          <Popover.Button
            as="div"
            className={classNames(
              'h-10 rounded-full bg-white flex items-center justify-center hover:cursor-pointer',
              showRing ? 'ring-1 ring-gray-300' : 'ring-0',
              stockedData.stocked.length > 0 ? 'text-blue-600 hover:text-blue-500' : 'text-gray-300 hover:text-gray-400',
            )}
            onClick={() => {
              if (stockedData.stocked.length == 0) {
                handleStockDefault();
              }
            }}
          >
            <ArchiveBoxIcon className={classNames('w-6 h-6')} />
          </Popover.Button>
          {showCounter ? <div className="text-center font-bold text-gray-500">{stockedData.count}</div> : <></>}
        </div>
        <Popover.Overlay className="fixed inset-0" />
        <Popover.Panel
          className={classNames(
            popoverDirection === 'right' ? '-top-3 left-12' : '',
            popoverDirection === 'left' ? '-top-3 right-12' : '',
            'absolute shadow-xl bg-white ring-1 ring-gray-300 rounded-md',
          )}
          focus={true}
        >
          <div className="p-4 w-80">
            <fieldset>
              <legend className="sr-only">Stock labels</legend>
              <div className="space-y-2">
                {labelData?.data.map((label) => (
                  <div key={label.id} className="relative flex items-start">
                    <div className="flex h-6 items-center">
                      <input
                        id={label.id}
                        name={label.id}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        checked={stockedData.stocked.find((stock) => stock.labelId === label.id) ? true : false}
                        onChange={handleStockWithLabel}
                      />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                      <label htmlFor={label.id} className="font-medium text-gray-900">
                        {label.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>

            <div className="flex gap-2 items-center mt-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1 pb-1">
                    <FolderPlusIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="test"
                    className="block w-full pl-8 text-sm border-0 ring-0 shadow-none border-b border-gray-400 focus:border-indigo-600 focus-visible:outline-none"
                    placeholder="新規カテゴリー"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <button
                  className="rounded-md text-sm border border-gray-400 p-1 focus:ring-0 focus-visible:outline-indigo-500"
                  onClick={handleCreateLabel}
                >
                  作成
                </button>
              </div>
            </div>
          </div>
        </Popover.Panel>
      </div>
    </Popover>
  );
}
