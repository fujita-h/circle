'use client';

import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { Topic } from '@/types';
import { classNames } from '@/utils';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';
import { CardList } from '@/components/topics';

export function Loader() {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: topics, isLoading } = useSWR<{ data: Topic[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/topics`,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  if (isLoading) {
    return <div>loading...</div>;
  }

  return (
    <>
      <CardList topics={topics?.data || []} />
    </>
  );
}
