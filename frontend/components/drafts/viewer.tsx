'use client';

import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import Link from 'next/link';

export function Viewer({ itemId }: { itemId: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const jsonCredFetcher = swrMsalTokenFetcher(instance, account, environment, 'json', 'include');
  const { data: token, isLoading: isTokenLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/user/token`, jsonCredFetcher);
  const jsonFetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const { data: item, isLoading: isItemLoading } = useSWR<any>(`${environment.BACKEND_ENDPOINT}/drafts/${itemId}`, jsonFetcher, {
    revalidateOnFocus: false,
  });
  const textFetcher = swrMsalTokenFetcher(instance, account, environment, 'text');
  const { data: markdown, isLoading: isMarkdownLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/drafts/${itemId}/md`, textFetcher, {
    revalidateOnFocus: false,
  });

  if (isTokenLoading || isItemLoading || isMarkdownLoading) {
    return <div>loading...</div>;
  }

  if (!item) {
    return <div>No Item</div>;
  }

  return (
    <>
      <div>
        <Link href={`/drafts/${item.id}/edit`}>
          <span className="border rounded-md px-2 py-1 text-center bg-blue-200">Edit</span>
        </Link>
      </div>
      <div>{item.title}</div>
      <div>{markdown}</div>
    </>
  );
}
