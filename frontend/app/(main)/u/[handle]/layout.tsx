'use client';

import Link from 'next/link';
import { Inter } from 'next/font/google';
import { classNames, capitalize } from '@/utils';
import { UserIcon } from '@heroicons/react/20/solid';

import { useAccount, useMsal } from '@azure/msal-react';
import { useEnvironment } from '@/components/environment/providers';
import { CategoryHeader } from '@/components/category-header';
import { TabItem } from '@/components/category-header.types';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { BackendImage } from '@/components/backend-image';
import useSWR from 'swr';

const inter = Inter({ subsets: ['latin'] });

export default function Layout({ params, children }: { params: any; children: React.ReactNode }) {
  const handle = params.handle;
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: user } = useSWR(`${environment.BACKEND_ENDPOINT}/users/handle/${handle}`, fetcher, { revalidateOnFocus: false });

  if (!user) {
    return <div>loading...</div>;
  }

  const tabs: TabItem[] = [
    { name: 'Overview', href: `/u/${handle}/overview`, current: false },
    { name: 'Joined', href: `/u/${handle}/joined`, current: false },
    { name: 'Items', href: `/u/${handle}/items`, current: false },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="bg-white rounded-md p-4">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex space-x-4 items-center">
              <BackendImage
                src={`/users/${user.id}/photo`}
                className="h-16 w-16 rounded-full bg-gray-50"
                alt="user-icon"
                fallback={<UserIcon className="h-16 w-16 rounded-full bg-gray-100 text-gray-400" />}
              />
              <h2 className={classNames(inter.className, 'text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight')}>
                {user.name}
              </h2>
            </div>
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
