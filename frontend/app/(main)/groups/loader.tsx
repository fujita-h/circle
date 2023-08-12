'use client';

import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';
import { User, Membership, Group, SomeRequired } from '@/types';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { CardList } from '@/components/groups/list';
import { LinkPagination } from '@/components/paginations';

export function Loader({ pathname, page, take }: { pathname: string; page: number; take: number }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  // calculate skip
  const skip = (page - 1) * take;

  // fetch data
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: groups, isLoading } = useSWR<{ data: Group[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/groups?take=${take}&skip=${skip}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  // render loading
  if (isLoading) {
    return <div>loading...</div>;
  }

  // render error
  if (!groups || groups.data.length === 0 || groups.meta.total === 0) {
    return <div>No members</div>;
  }

  return (
    <>
      <CardList groups={groups.data} />
      <div className="py-5">
        <LinkPagination pathname={pathname} page={page} total={groups.meta.total} take={take} />
      </div>
    </>
  );
}
