'use client';

import { classNames } from '@/utils';
import useSWR from 'swr';
import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { apiRequest } from '@/components/msal/requests';
import { HeartIcon } from '@heroicons/react/24/solid';

export function LikeButton({ noteId }: { noteId: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const jsonFetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const { data, isLoading, mutate } = useSWR<{ liked: any; count: number }>(
    `${environment.BACKEND_ENDPOINT}/user/liked/notes/${noteId}`,
    jsonFetcher,
    {
      revalidateOnFocus: false,
    },
  );

  if (isLoading || !data) {
    return <></>;
  }

  const handleLike = async () => {
    if (!account) return;
    const auth = await instance.acquireTokenSilent({
      account,
      scopes: apiRequest(environment).scopes,
    });
    const response = await fetch(`${environment.BACKEND_ENDPOINT}/user/liked/notes/${noteId}`, {
      method: data.liked ? 'DELETE' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });
    if (response.ok) {
      mutate();
    }
  };

  return (
    <div className="flex flex-col w-10">
      <div className="h-10 rounded-full ring-1 ring-gray-300 flex items-center justify-center hover:cursor-pointer" onClick={handleLike}>
        <HeartIcon className={classNames('w-6 h-6', data.liked ? 'text-red-400' : 'text-gray-300')} />
      </div>
      <div className="text-center font-bold text-gray-500">{data.count}</div>
    </div>
  );
}
