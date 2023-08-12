'use client';

import { useEnvironment } from '@/components/environment/providers';
import { CardList } from '@/components/groups';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { LinkPagination } from '@/components/paginations';
import { Group, Membership, SomeRequired, User } from '@/types';
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
  const { data: members, isLoading } = useSWR<{ data: SomeRequired<Membership, 'Group'>[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/users/${user.id}/joined/groups?take=${take}&skip=${skip}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  // render loading
  if (isLoading) {
    return <div>loading...</div>;
  }

  // render error
  if (!members || members.data.length === 0 || members.meta.total === 0) {
    return <div>No members</div>;
  }

  return (
    <>
      <CardList groups={members.data.map((x) => x.Group).filter((x): x is Group => x !== undefined)} />
      <div className="py-5">
        <LinkPagination pathname={pathname} page={page} total={members.meta.total} take={take} />
      </div>
    </>
  );
}
