'use client';

import Link from 'next/link';
import { Inter } from 'next/font/google';
import { classNames, capitalize } from '@/utils';
import { useAccount, useMsal } from '@azure/msal-react';
import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import useSWR from 'swr';

const inter = Inter({ subsets: ['latin'] });

export default function Page({ params }: { params: any }) {
  const handle = params.handle;
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: group } = useSWR(`${environment.BACKEND_ENDPOINT}/groups/handle/${handle}`, fetcher, { revalidateOnFocus: false });

  if (!group) {
    return <div>loading...</div>;
  }

  const date = new Date();
  return (
    <>
      <div className="sm:mx-4 sm:my-8 lg:mx-6">
        <div className="border-b border-gray-200 pb-3 mb-3">
          <h3 className="text-base font-semibold leading-6 text-gray-900">グループの説明</h3>
        </div>
        <div className="sm:pl-4">
          {group.description ? <div>{group.description}</div> : <div className="text-gray-500">グループの説明がありません</div>}
        </div>
      </div>
    </>
  );
}
