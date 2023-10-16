'use client';

import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { CardList } from '@/components/groups/list';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';

export function Loader({ category, take }: { category: 'weekly' | 'monthly'; take: number }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  // fetch data
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: groups, isLoading } = useSWR<{ data: any[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/user/trending/groups/${category}?take=${take}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  // render loading
  if (isLoading) {
    return <div>loading...</div>;
  }

  // render error
  if (!groups || groups.data.length === 0 || groups.meta.total === 0) {
    return <div>No Item</div>;
  }

  return (
    <>
      <CardList groups={groups.data} />
    </>
  );
}
