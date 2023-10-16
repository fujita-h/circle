'use client';

import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { CardList } from '@/components/topics';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';
import { Topic } from '@/types';

export function Loader({ category, take }: { category: 'weekly' | 'monthly'; take: number }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  // fetch data
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: topics, isLoading } = useSWR<{ data: Topic[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/user/trending/topics/${category}?take=${take}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  // render loading
  if (isLoading) {
    return <div>loading...</div>;
  }

  // render error
  if (!topics || topics.data.length === 0 || topics.meta.total === 0) {
    return <div>No Item</div>;
  }

  return (
    <>
      <CardList topics={topics.data} />
    </>
  );
}
