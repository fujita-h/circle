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
  const { data: note, isLoading: isNoteLoading } = useSWR<Note>(`${environment.BACKEND_ENDPOINT}/notes/${id}`, jsonFetcher, {
    revalidateOnFocus: false,
  });

  if (isTokenLoading || isNoteLoading) {
    return <div>loading...</div>;
  }

  if (!note) {
    return <div>Not Found</div>;
  }

  return (
    <>
      <div className={styles.editor}>
        <Editor
          defaultSubmitButton="publish"
          noteId={note.id}
          groupId={note.groupId}
          Topics={note.Topics?.filter((x) => x?.Topic !== undefined).map((x) => x!.Topic!) || []}
          title={note.title}
          body={note.body}
        />
      </div>
    </>
  );
}
