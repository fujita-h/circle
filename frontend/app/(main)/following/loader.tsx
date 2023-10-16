'use client';

import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { CardList } from '@/components/notes/list';
import { LinkPagination } from '@/components/paginations';
import { UserSetting } from '@/types';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';

export function Loader({ pathname, page, take }: { pathname: string; page: number; take: number }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  // calculate skip
  const skip = (page - 1) * take;

  // fetch data
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: setting, isLoading: isSettingLoading } = useSWR<UserSetting>(`${environment.BACKEND_ENDPOINT}/user/setting`, fetcher, {
    revalidateOnFocus: false,
  });
  const { data: notes, isLoading: isNotesLoading } = useSWR<{ data: any[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/user/following/notes?take=${take}&skip=${skip}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  // render loading
  if (isSettingLoading || isNotesLoading) {
    return <div>loading...</div>;
  }

  // render error
  if (!notes || notes.data.length === 0 || notes.meta.total === 0) {
    return <div>No Item</div>;
  }

  return (
    <>
      <CardList notes={notes.data} forceSingleCols={setting?.listNotesStyle === 'LIST'} />
      <div className="py-5">
        <LinkPagination pathname={pathname} page={page} total={notes.meta.total} take={take} />
      </div>
    </>
  );
}
