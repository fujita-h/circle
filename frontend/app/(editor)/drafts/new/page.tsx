'use client';

import { Editor } from '@/components/editor';
import styles from '../../styles.module.css';
import { useAccount, useMsal } from '@azure/msal-react';
import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const jsonCredFetcher = swrMsalTokenFetcher(instance, account, environment, 'json', 'include');
  const { data, isLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/user/token`, jsonCredFetcher);
  const searchParams = useSearchParams();

  if (isLoading) {
    return <div>loading...</div>;
  }

  const groupId = searchParams.get('group') || undefined;
  return (
    <>
      <div className={styles.editor}>
        <Editor defaultSubmitButton="draft" groupId={groupId} />
      </div>
    </>
  );
}
