'use client';

import styles from '@/app/(editor)/styles.module.css';
import { Editor } from '@/components/editor';
import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { Note } from '@/types';
import { useAccount, useMsal } from '@azure/msal-react';
import useSWR from 'swr';

export default function Page({ params }: { params: any }) {
  const id = params.id;
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const jsonCredFetcher = swrMsalTokenFetcher(instance, account, environment, 'json', 'include');
  const { data: token, isLoading: isTokenLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/user/token`, jsonCredFetcher);
  const jsonFetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const { data: draft, isLoading: isItemLoading } = useSWR<Note>(`${environment.BACKEND_ENDPOINT}/drafts/${id}`, jsonFetcher, {
    revalidateOnFocus: false,
  });

  if (isTokenLoading || isItemLoading) {
    return <div>loading...</div>;
  }

  if (!draft) {
    return <div>Not Found</div>;
  }

  return (
    <>
      <div className={styles.editor}>
        <Editor
          defaultSubmitButton="draft"
          noteId={draft.id}
          groupId={draft.groupId}
          Topics={draft.Topics?.filter((x) => x?.Topic !== undefined).map((x) => x!.Topic!) || []}
          title={draft.title}
          body={draft.body}
        />
      </div>
    </>
  );
}
