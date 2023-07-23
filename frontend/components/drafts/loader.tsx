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
  const { data: drafts, isLoading } = useSWR<{ data: any[]; meta: { total: number } }>(`${environment.BACKEND_ENDPOINT}/drafts`, fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return <div>loading...</div>;
  }

  if (!drafts || drafts.data.length === 0 || drafts.meta.total === 0) {
    return <div>No Drafts</div>;
  }

  return (
    <>
      <List active={activeDraftId} drafts={drafts.data} />
    </>
  );
}
