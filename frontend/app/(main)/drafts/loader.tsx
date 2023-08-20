'use client';

import { CardList } from '@/components/drafts';
import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { LinkPagination } from '@/components/paginations';
import { Note, SomeRequired } from '@/types';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';

export function Loader({ pathname, page, take, activeDraftId }: { pathname: string; page: number; take: number; activeDraftId?: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  // calculate skip
  const skip = (page - 1) * take;

  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: drafts, isLoading } = useSWR<{ data: SomeRequired<Note, 'User'>[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/drafts?take=${take}&skip=${skip}`,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  if (isLoading) {
    return <div>loading...</div>;
  }

  if (!drafts || drafts.data.length === 0 || drafts.meta.total === 0) {
    return <div>No Drafts</div>;
  }

  return (
    <>
      <CardList active={activeDraftId} drafts={drafts.data} />
      <div className="py-5">
        <LinkPagination pathname={pathname} page={page} total={drafts.meta.total} take={take} />
      </div>
    </>
  );
}
