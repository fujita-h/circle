'use client';

import { Fragment, useState } from 'react';
import { Transition, Dialog, Popover } from '@headlessui/react';
import { classNames } from '@/utils';
import useSWR from 'swr';
import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { apiRequest } from '@/components/msal/requests';
import { ArchiveBoxIcon } from '@heroicons/react/24/solid';
import { Stock } from '@/types';

export function StockButton({ noteId }: { noteId: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const jsonFetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const {
    data: stockedData,
    isLoading: isStockedLoading,
    mutate,
  } = useSWR<{ stocked: Stock[]; count: number }>(`${environment.BACKEND_ENDPOINT}/user/stocked/notes/${noteId}`, jsonFetcher, {
    revalidateOnFocus: false,
  });
  const { data: labelData, isLoading: isLabelLoading } = useSWR<{ data: any[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/user/stocked/labels`,
    jsonFetcher,
    {
      revalidateOnFocus: false,
    },
  );

  const handleStock = async (e: any) => {
    console.log(e.target.name, e.target.checked);
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
      mutate();
    }
  };

  if (isStockedLoading || isLabelLoading || !stockedData) {
    return <></>;
  }

  return (
    <Popover>
      <div className="relative">
        <div className="flex flex-col w-10">
          <Popover.Button as="div" className="h-10 rounded-full ring-1 ring-gray-300 flex items-center justify-center hover:cursor-pointer">
            <ArchiveBoxIcon className={classNames('w-6 h-6', stockedData.stocked.length > 0 ? 'text-blue-600' : 'text-gray-300')} />
          </Popover.Button>
          <div className="text-center font-bold text-gray-500">{stockedData.count}</div>
        </div>
        <Popover.Panel className="absolute top-0 left-12 shadow-lg bg-white ring-1 ring-gray-300 rounded-md">
          <div className="px-3 py-2 w-40">
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
                        onChange={handleStock}
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
          </div>
        </Popover.Panel>
      </div>
    </Popover>
  );
}
