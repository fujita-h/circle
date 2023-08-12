'use client';

import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { LinkPagination } from '@/components/paginations';
import { CardList } from '@/components/users';
import { User } from '@/types';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';

export function Loader({ pathname, page, take }: { pathname: string; page: number; take: number }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  // calculate skip
  const skip = (page - 1) * take;

  // fetch data
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: users, isLoading } = useSWR<{ data: User[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/users?take=${take}&skip=${skip}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  // render loading
  if (isLoading) {
    return <div>loading...</div>;
  }

  // render error
  if (!users || users.data.length === 0 || users.meta.total === 0) {
    return <div>No members</div>;
  }

  return (
    <div>
      <CardList users={users.data} />
      <div className="py-5">
        <LinkPagination pathname={pathname} page={page} total={users.meta.total} take={take} />
      </div>
    </div>
  );
}
