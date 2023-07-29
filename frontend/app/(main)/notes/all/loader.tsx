'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { CardList } from '@/components/notes/list';
import { LinkPagination } from '@/components/paginations';

export function Loader({ pathname, page, take }: { pathname: string; page: number; take: number }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  // path and pagination data
  const skip = (page - 1) * take;

  // fetch data
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: notes, isLoading } = useSWR<{ data: any[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/notes?take=${take}&skip=${skip}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  // render loading
  if (isLoading) {
    return <div>loading...</div>;
  }

  // render error
  if (!notes || notes.data.length === 0 || notes.meta.total === 0) {
    return <div>No Item</div>;
  }

  return (
    <>
      <CardList notes={notes.data} />
      <LinkPagination pathname={pathname} page={page} total={notes.meta.total} take={take} />
    </>
  );
}
