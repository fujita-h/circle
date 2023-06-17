'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { MemberList } from './list';
import { Pagination } from '@/components/pagination';

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
  const { data: members, isLoading: isDataLoading } = useSWR<any[]>(
    `${environment.BACKEND_ENDPOINT}/${sourcePath}?take=${take}&skip=${skip}`,
    fetcher,
    { revalidateOnFocus: false },
  );
  const { data: total, isLoading: isCountLoading } = useSWR<number>(
    `${environment.BACKEND_ENDPOINT}/${countPath ?? sourcePath + '/count'}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  // render loading
  if (isDataLoading || isCountLoading) {
    return <div>loading...</div>;
  }

  // render error
  if (!members || total === undefined) {
    return <div>No Item</div>;
  }

  return (
    <>
      <MemberList members={members} />
      <Pagination pathname={pathname} page={page} total={total} take={take} />
    </>
  );
}
