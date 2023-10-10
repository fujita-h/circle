'use client';

import Link from 'next/link';
import { Inter } from 'next/font/google';
import { classNames, capitalize } from '@/utils';
import { UserIcon } from '@heroicons/react/24/solid';
import { useAccount, useMsal } from '@azure/msal-react';
import { useEnvironment } from '@/components/environment/providers';
import { NavigationTabs, TabItem } from '@/components/tabs';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { BackendImage } from '@/components/backend-image';
import useSWR from 'swr';
import { Group, Membership, User, SomeRequired } from '@/types';
import { apiRequest } from '@/components/msal/requests';
import { FollowUser } from '@/types/follow-user';

const inter = Inter({ subsets: ['latin'] });

export default function Layout({ params, children }: { params: any; children: React.ReactNode }) {
  const handle = params.handle;
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: user } = useSWR<SomeRequired<User, '_count'>>(`${environment.BACKEND_ENDPOINT}/users/handle/${handle}`, fetcher, {
    revalidateOnFocus: false,
  });

  if (!user) {
    return <div>loading...</div>;
  }

  const tabs: TabItem[] = [
    { name: 'Notes', href: `/users/${handle}/notes`, current: false, count: user._count.Notes },
    { name: 'Joined', href: `/users/${handle}/joined`, current: false, count: user._count.Joined },
  ];

  return (
    <div>
      <div className="pt-4 bg-white ring-1 ring-gray-200">
        <div className="max-w-screen-2xl mx-auto">
          <div className="px-4 lg:px-8">
            <div className="py-8 px-12">
              <div className="flex gap-8">
                <div className="flex-none">
                  <BackendImage
                    src={`/users/${user.id}/photo`}
                    className="w-24 h-24 rounded-full border border-gray-200 bg-gray-50"
                    fallback={<UserIcon className="w-24 h-24 rounded-full border border-gray-200 bg-gray-100 text-gray-400" />}
                  />
                </div>
                <div className="flex-1">
                  <div>
                    <span
                      className={classNames(
                        inter.className,
                        'mb-1 text-2xl font-semibold leading-7 text-gray-900 break-all sm:text-3xl sm:tracking-tight',
                      )}
                    >
                      {user.name || user.handle}
                    </span>
                  </div>
                  <div>
                    <span> </span>
                  </div>
                </div>
                <div className="flex-none">
                  <div className="flex flex-row sm:flex-col justify-center sm:justify-normal gap-4">
                    <FollowUserButton user={user} />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4">
              <NavigationTabs tabs={tabs} />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-slate-100 print:bg-white border-t border-gray-200">
        <div className="max-w-screen-2xl mx-auto">
          <div className="p-4 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FollowUserButton({ user }: { user: User }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data, isLoading, mutate } = useSWR<FollowUser>(`${environment.BACKEND_ENDPOINT}/user/following/users/${user.id}`, fetcher, {
    revalidateOnFocus: false,
  });

  const handleClick = async (action: 'follow' | 'unfollow') => {
    if (!account) return;
    const auth = await instance.acquireTokenSilent({
      account,
      scopes: apiRequest(environment).scopes,
    });
    const method = action === 'follow' ? 'PUT' : 'DELETE';
    const response = await fetch(`${environment.BACKEND_ENDPOINT}/user/following/users/${user.id}`, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });

    if (response.ok) {
      mutate();
    }
  };

  if (isLoading) {
    return <></>;
  }

  if (data?.toId) {
    return (
      <button
        type="button"
        className="min-w-[120px] ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-indigo-700 hover: cursor-pointer"
        onClick={() => {
          handleClick('unfollow');
        }}
      >
        <div className="w-full text-center">フォロー中</div>
      </button>
    );
  } else {
    return (
      <button
        type="button"
        className="min-w-[120px] ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover: cursor-pointer"
        onClick={() => {
          handleClick('follow');
        }}
      >
        <div className="w-full text-center">フォロー</div>
      </button>
    );
  }
}
