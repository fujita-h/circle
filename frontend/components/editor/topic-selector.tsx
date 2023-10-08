'use client';

import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { TopicInput } from '@/components/topics';
import { Topic } from '@/types';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';

export function TopicSelector({ topics, onChange }: { topics: Topic[]; onChange: (values: Topic[]) => void }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const {
    data: candidates,
    isLoading,
    error,
  } = useSWR<{ data: Topic[] }>(`${environment.BACKEND_ENDPOINT}/topics`, fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading || error || !candidates) {
    return <></>;
  }

  return <TopicInput values={topics} candidates={candidates?.data} onChange={onChange} />;
}
