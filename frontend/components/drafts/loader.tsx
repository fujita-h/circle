'use client';

import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { ItemList } from './list';

export function Loader({ activeItemId }: { activeItemId?: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: count, isLoading: isCountLoading } = useSWR<number>(`${environment.BACKEND_ENDPOINT}/drafts/count`, fetcher, {
    revalidateOnFocus: false,
  });

  const { data: items, isLoading: isGroupLoading } = useSWR<any[]>(`${environment.BACKEND_ENDPOINT}/drafts?skip=0&take=200`, fetcher, {
    revalidateOnFocus: false,
  });

  if (isCountLoading || isGroupLoading) {
    return <div>loading...</div>;
  }

  if (!items || count === undefined) {
    return <div>No Item</div>;
  }

  return (
    <>
      <ItemList active={activeItemId} items={items} />
    </>
  );
}
