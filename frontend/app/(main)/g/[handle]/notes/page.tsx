'use client';

import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { Group } from '@/types';
import { useAccount, useMsal } from '@azure/msal-react';
import { usePathname, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Loader } from './loader';

export default function Page({ params }: { params: any }) {
  const handle = params.handle;
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data, isLoading, mutate } = useSWR<Group>(`${environment.BACKEND_ENDPOINT}/groups/handle/${handle}`, fetcher, {
    revalidateOnFocus: false,
  });

  // path and pagination data
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const page = Number(pageParam) ? (Number(pageParam) > 0 ? Number(pageParam) : 1) : 1;

  if (isLoading) {
    return <></>;
  }

  if (!data) {
    return <>Group Not Found</>;
  }

  return (
    <>
      <Loader group={data} pathname={pathname} page={page} take={20} />
    </>
  );
}
