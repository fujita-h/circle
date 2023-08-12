'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';
import { Group } from '@/types';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { CardList } from '@/components/groups/members/list';
import { LinkPagination } from '@/components/paginations';

export function Loader({ group, pathname, page, take }: { group: Group; pathname: string; page: number; take: number }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  // calculate skip
  const skip = (page - 1) * take;

  // fetch data
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: members, isLoading } = useSWR<{ data: any[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/groups/${group.id}/members?take=${take}&skip=${skip}`,
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
    <div>
      <CardList members={members.data} />
      <div className="py-5">
        <LinkPagination pathname={pathname} page={page} total={members.meta.total} take={take} />
      </div>
    </div>
  );
}
