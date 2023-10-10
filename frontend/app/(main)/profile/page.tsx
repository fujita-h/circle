'use client';

import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import { useEffect } from 'react';
import useSWR from 'swr';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { useRouter } from 'next/navigation';
import { User } from '@/types';

export default function Page() {
  const router = useRouter();
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data, isLoading } = useSWR<User>(`${environment.BACKEND_ENDPOINT}/user`, fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (data && data.handle) {
      router.replace(`/users/${data.handle}`);
    }
  }, [data, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>Error</div>;
  }
}
