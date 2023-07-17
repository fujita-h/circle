'use client';

import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { List } from './list';

export function Loader({ activeDraftId }: { activeDraftId?: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: count, isLoading: isCountLoading } = useSWR<number>(`${environment.BACKEND_ENDPOINT}/drafts/count`, fetcher, {
    revalidateOnFocus: false,
  });

  const { data: drafts, isLoading: isDraftsLoading } = useSWR<any[]>(`${environment.BACKEND_ENDPOINT}/drafts?skip=0&take=200`, fetcher, {
    revalidateOnFocus: false,
  });

  if (isCountLoading || isDraftsLoading) {
    return <div>loading...</div>;
  }

  if (!drafts || drafts.length === 0 || count === undefined) {
    return <div>No Drafts</div>;
  }

  return (
    <>
      <List active={activeDraftId} drafts={drafts} />
    </>
  );
}
