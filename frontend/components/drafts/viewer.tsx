'use client';

import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import Link from 'next/link';

export function Viewer({ noteId }: { noteId: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const jsonCredFetcher = swrMsalTokenFetcher(instance, account, environment, 'json', 'include');
  const { data: token, isLoading: isTokenLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/user/token`, jsonCredFetcher);
  const jsonFetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const { data: draft, isLoading: isDraftLoading } = useSWR<any>(`${environment.BACKEND_ENDPOINT}/drafts/${noteId}`, jsonFetcher, {
    revalidateOnFocus: false,
  });
  const textFetcher = swrMsalTokenFetcher(instance, account, environment, 'text');
  const { data: markdown, isLoading: isMarkdownLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/drafts/${noteId}/md`, textFetcher, {
    revalidateOnFocus: false,
  });

  if (isTokenLoading || isDraftLoading || isMarkdownLoading) {
    return <div>loading...</div>;
  }

  if (!draft) {
    return <div>No Item</div>;
  }

  return (
    <div className="px-4 py-2">
      <div className="flex">
        <div className="flex-1 py-2 pl-2 text-lg font-bold">{draft.title}</div>
        <div className="flex gap-2 justify-end">
          <Link href={`/drafts/${draft.id}/edit`}>
            <div className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 hover:cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              編集する
            </div>
          </Link>
        </div>
      </div>
      <div className="border rounded-md p-2 border-gray-300">
        <pre className="font-sans text-inherit">{markdown}</pre>
      </div>
    </div>
  );
}
