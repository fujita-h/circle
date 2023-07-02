'use client';

import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import useSWR from 'swr';
import { ReactMarkdownParser } from '@/components/react-markdown';
import mdStyles from '@/components/react-markdown/styles.module.css';

export function MarkdownLoader({ commentId }: { commentId: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const jsonCredFetcher = swrMsalTokenFetcher(instance, account, environment, 'json', 'include');
  const { data: token, isLoading: isTokenLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/user/token`, jsonCredFetcher);

  const textFetcher = swrMsalTokenFetcher(instance, account, environment, 'text');
  const { data: markdown, isLoading: isMarkdownLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/comments/${commentId}/md`, textFetcher, {
    revalidateOnFocus: false,
  });

  if (isTokenLoading || isMarkdownLoading) {
    return <div>loading...</div>;
  }

  return <ReactMarkdownParser className={mdStyles.comment}>{markdown}</ReactMarkdownParser>;
}
