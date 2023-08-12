'use client';

import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { CardList } from '@/components/notes/list';
import { LinkPagination } from '@/components/paginations';
import { User, Note, SomeRequired } from '@/types';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';

export function Loader({ user, pathname, page, take }: { user: User; pathname: string; page: number; take: number }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  // calculate skip
  const skip = (page - 1) * take;

  // fetch data
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: notes, isLoading } = useSWR<{ data: SomeRequired<Note, 'User' | '_count'>[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/users/${user.id}/notes?take=${take}&skip=${skip}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  // render loading
  if (isLoading) {
    return <div>loading...</div>;
  }

  // render error
  if (!notes || notes.data.length === 0 || notes.meta.total === 0) {
    return <div>No Item</div>;
  }

  return (
    <>
      <CardList notes={notes.data} isGroupList={true} />
      <div className="py-5">
        <LinkPagination pathname={pathname} page={page} total={notes.meta.total} take={take} />
      </div>
    </>
  );
}
