'use client';

import { Suspense } from 'react';
import { useAccount, useMsal } from '@azure/msal-react';
import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import useSWR from 'swr';
import { UpdatePhotoForm } from '@/components/groups/settings';

export default function Page({ params }: { params: any }) {
  const handle = params.handle;
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data, error, isLoading } = useSWR<any>(`${environment.BACKEND_ENDPOINT}/groups/handle/${handle}`, fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 0,
  });

  if (isLoading) return <div>loading...</div>;
  if (error) {
    console.error(error);
    return <div>{error.message || 'Error'}</div>;
  }

  return (
    <>
      {/* Image Form */}
      <div className="divide-y divide-white/5">
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">アイコン画像</h2>
            <p className="mt-1 text-sm leading-6 text-gray-400">アイコン画像を変更します。</p>
          </div>
          <Suspense fallback={<div>Loading...</div>}>
            <UpdatePhotoForm groupId={data.id} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
