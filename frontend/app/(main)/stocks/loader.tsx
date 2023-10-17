'use client';

import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { CardList } from '@/components/notes/list';
import { LinkPagination } from '@/components/paginations';
import { Stock, StockLabel } from '@/types';
import { useAccount, useMsal } from '@azure/msal-react';
import clsx from 'clsx';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';

export function LabelsLoader({ activeLabelId, onChanged }: { activeLabelId?: string; onChanged?: (label?: StockLabel) => void }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: labels, isLoading } = useSWR<{ data: StockLabel[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/user/stocked/labels`,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );
  const { data: stocks } = useSWR<{ data: Stock[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/user/stocked/notes?skip=0&take=1`,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  if (isLoading) {
    return <div>loading...</div>;
  }

  if (!labels || labels.data.length === 0 || labels.meta.total === 0) {
    return <div>No Labels</div>;
  }

  return (
    <>
      <ul role="list" className="grid grid-cols-1 gap-1">
        <li className="relative">
          <button
            onClick={() => onChanged?.()}
            className={clsx(
              activeLabelId === undefined ? 'bg-indigo-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900',
              'group w-full flex items-center px-2 py-1 rounded-md',
            )}
          >
            <span className="truncate">All</span>
            <span
              className={clsx(
                activeLabelId === undefined ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                'ml-auto inline-block px-3 rounded-full',
              )}
            >
              {stocks?.meta.total || 0}
            </span>
          </button>
        </li>
        {labels.data.map((label) => {
          const count = label._count?.Stocks || 0;
          return (
            <li key={label.id} className="relative">
              <button
                onClick={() => onChanged?.(label)}
                className={clsx(
                  activeLabelId === label.id ? 'bg-indigo-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900',
                  'group w-full flex items-center px-2 py-1 rounded-md',
                )}
              >
                <span className="truncate pr-1">{label.name}</span>
                <span
                  className={clsx(
                    activeLabelId === label.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'ml-auto inline-block px-3 rounded-full',
                  )}
                >
                  {count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function ItemsLoader({ labelId, pathname, page, take }: { labelId?: string; pathname: string; page: number; take: number }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const skip = (page - 1) * take;
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  params.delete('page');

  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const url = labelId
    ? `${environment.BACKEND_ENDPOINT}/user/stocked/labels/${labelId}/notes`
    : `${environment.BACKEND_ENDPOINT}/user/stocked/notes`;

  const { data: stocks, isLoading } = useSWR<{ data: any[]; meta: { total: number } }>(`${url}?skip=${skip}&take=${take}`, fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return <div>loading...</div>;
  }
  const notes = stocks?.data.map((stock) => stock.Note) || [];

  return (
    <>
      <CardList notes={notes} forceSingleCols={true} />
      <div className="py-5">
        <LinkPagination pathname={pathname} page={page} total={stocks?.meta.total || 0} take={take} query={params.toString()} />
      </div>
    </>
  );
}
