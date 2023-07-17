'use client';

import Link from 'next/link';
import { Inter } from 'next/font/google';
import { classNames, capitalize } from '@/utils';
import { useAccount, useMsal } from '@azure/msal-react';
import { useEnvironment } from '@/components/environment/providers';
import { CategoryHeader } from '@/components/category-header';
import { TabItem } from '@/components/category-header.types';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import useSWR from 'swr';
import {
  ReadNotePermissionBadge,
  WriteNotePermissionBadge,
  WriteNoteConditionBadge,
  JoinCircleConditionBadge,
} from '@/components/circles/badges';
import { apiRequest } from '@/components/msal/requests';

const inter = Inter({ subsets: ['latin'] });

export default function Layout({ params, children }: { params: any; children: React.ReactNode }) {
  const handle = params.handle;
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: circle, mutate: circleMutate } = useSWR(`${environment.BACKEND_ENDPOINT}/circles/handle/${handle}`, fetcher, {
    revalidateOnFocus: false,
  });
  const {
    data: joined,
    isLoading: isJoinedLoading,
    mutate: joinedMutate,
  } = useSWR(`${environment.BACKEND_ENDPOINT}/user/joined/circles/handle/${handle}`, fetcher, {
    revalidateOnFocus: false,
  });

  if (!circle) {
    return <div>loading...</div>;
  }

  if (isJoinedLoading) {
    return <div>loading...</div>;
  }

  const tabs: TabItem[] = [
    { name: 'Overview', href: `/c/${handle}/overview`, current: false },
    { name: 'Members', href: `/c/${handle}/members`, current: false },
    { name: 'Notes', href: `/c/${handle}/notes`, current: false },
  ];

  if (joined?.role === 'ADMIN') {
    tabs.push({ name: 'Settings', href: `/c/${handle}/settings`, current: false });
  }

  const handleJoin = async () => {
    if (!account) return;

    const auth = await instance.acquireTokenSilent({
      account,
      scopes: apiRequest(environment).scopes,
    });
    const response = await fetch(`${environment.BACKEND_ENDPOINT}/user/joined/circles/${circle.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });

    if (response.ok) {
      circleMutate();
      joinedMutate();
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="bg-white rounded-md p-4">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap gap-2">
              <ReadNotePermissionBadge permission={circle.readItemPermission} />
              <WriteNotePermissionBadge permission={circle.writeItemPermission} />
              <WriteNoteConditionBadge condition={circle.writeItemCondition} />
              <JoinCircleConditionBadge condition={circle.joinCondition} />
            </div>
            <h2 className={classNames(inter.className, 'text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight')}>
              {circle.name}
            </h2>
          </div>
          <div className="mt-4 md:flex md:ml-4 md:mt-0">
            {joined?.role ? (
              <Link href={`/drafts/new?circle=${circle.id}`}>
                <div className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                  このグループに投稿する
                </div>
              </Link>
            ) : (
              <>
                {circle.type === 'OPEN' ? (
                  <div
                    className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover: cursor-pointer"
                    onClick={handleJoin}
                  >
                    このグループに参加する
                  </div>
                ) : (
                  <></>
                )}
              </>
            )}
          </div>
        </div>
        <div className="my-4">
          <CategoryHeader tabs={tabs} />
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
