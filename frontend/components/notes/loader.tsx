'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { List } from './list';
import { LinkPagination } from '@/components/paginations';

export function Loader({ sourcePath, countPath }: { sourcePath: string; countPath?: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  // path and pagination data
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const page = Number(pageParam) ? (Number(pageParam) > 0 ? Number(pageParam) : 1) : 1;
  const take = 10;
  const skip = (page - 1) * take;

  // fetch data
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: notes, isLoading } = useSWR<{ data: any[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/${sourcePath}?take=${take}&skip=${skip}`,
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
      <List notes={notes.data} />
      <LinkPagination pathname={pathname} page={page} total={notes.meta.total} take={take} />
    </>
  );
}
