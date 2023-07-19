'use client';

import { Editor } from '@/components/editor';
import styles from '../../../styles.module.css';
import { useAccount, useMsal } from '@azure/msal-react';
import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import useSWR from 'swr';

export default function Page({ params }: { params: any }) {
  const id = params.id;
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const jsonCredFetcher = swrMsalTokenFetcher(instance, account, environment, 'json', 'include');
  const { data: token, isLoading: isTokenLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/user/token`, jsonCredFetcher);
  const jsonFetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const { data: note, isLoading: isNoteLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/notes/${id}`, jsonFetcher, {
    revalidateOnFocus: false,
  });
  const textFetcher = swrMsalTokenFetcher(instance, account, environment, 'text');
  const { data: markdown, isLoading: isMarkdownLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/notes/${id}/md`, textFetcher, {
    revalidateOnFocus: false,
  });

  if (isTokenLoading || isNoteLoading || isMarkdownLoading) {
    return <div>loading...</div>;
  }

  if (!note) {
    return <div>Not Found</div>;
  }

  return (
    <>
      <div className={styles.editor}>
        <Editor defaultSubmitButton="publish" noteId={note.id} groupId={note.group?.id} title={note.title} body={markdown} />
      </div>
    </>
  );
}
