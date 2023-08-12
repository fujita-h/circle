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
    { name: 'Notes', href: `/u/${handle}/notes`, current: false, count: user._count.Notes },
    { name: 'Joined', href: `/u/${handle}/joined`, current: false, count: user._count.Joined },
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
