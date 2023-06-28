'use client';

import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';

export function List({ itemId }: { itemId: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  // fetch data
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: comments, isLoading: isDataLoading } = useSWR<any[]>(
    `${environment.BACKEND_ENDPOINT}/items/${itemId}/comments?take=${20}&skip=${0}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  if (isDataLoading) {
    return <div>loading...</div>;
  }

  return (
    <div>
      {comments?.map((comment) => (
        <div key={comment.id}>
          <div>{comment.id}</div>
        </div>
      ))}
    </div>
  );
}
