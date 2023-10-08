'use client';

import { useEnvironment } from '@/components/environment/providers';
import { apiRequest } from '@/components/msal/requests';
import { Parser } from '@/components/react-markdown/parser';
import mdStyles from '@/components/react-markdown/styles.module.css';
import { Topic } from '@/types';
import { classNames } from '@/utils';
import { useAccount, useMsal } from '@azure/msal-react';
import { DocumentTextIcon, PencilSquareIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { DnDTextarea } from './dnd-textarea';
import { GroupSelector } from './group-selector';
import styles from './styles.module.css';
import { SubmitButton } from './submit-button';
import { TopicSelector } from './topic-selector';

export function Editor({
  noteId = '',
  groupId = '',
  title = '',
  Topics = [],
  body = '',
  defaultSubmitButton = 'publish',
}: {
  noteId?: string;
  groupId?: string;
  title?: string;
  Topics?: Topic[];
  body?: string;
  defaultSubmitButton?: 'publish' | 'draft';
}) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const router = useRouter();
  const [renderKey, setRenderKey] = useState(true);
  const [editorMode, setEditorMode] = useState<'edit' | 'preview' | 'both'>('both');
  const { mutate } = useSWRConfig();

  type FormState = {
    id: string;
    group: {
      id: string;
    };
    Topics: Topic[];
    title: string;
    body: string;
  };

  const [form, setForm] = useState<FormState>({
    id: noteId,
    group: {
      id: groupId,
    },
    Topics: Topics,
    title: title,
    body: body,
  });

  const handleSubmit = async (status: 'PUBLISHED' | 'DRAFT') => {
    if (account) {
      try {
        const auth = await instance.acquireTokenSilent({
          account,
          scopes: apiRequest(environment).scopes,
        });
        const target = status === 'PUBLISHED' ? 'notes' : 'drafts';
        if (form.id) {
          // if form.id exists, update existing
          const response = await fetch(`${environment.BACKEND_ENDPOINT}/${target}/${form.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth.accessToken}`,
            },
            body: JSON.stringify({
              group: { id: form.group.id },
              topic: { ids: form.Topics.map((x) => x.id) },
              title: form.title,
              body: form.body,
            }),
          });
          if (response.ok) {
            const json = await response.json();
            if (target === 'drafts') {
              router.replace(`/drafts?id=${json.id}`);
            } else {
              router.replace(`/${target}/${json.id}`);
            }
          }
        } else {
          // if form.id does not exist, create
          const response = await fetch(`${environment.BACKEND_ENDPOINT}/${target}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth.accessToken}`,
            },
            body: JSON.stringify({
              group: { id: form.group.id },
              topic: { ids: form.Topics.map((x) => x.id) },
              title: form.title,
              body: form.body,
            }),
          });
          if (response.ok) {
            const json = await response.json();
            mutate(`${environment.BACKEND_ENDPOINT}/${target}/${json.id}`);
            mutate(`${environment.BACKEND_ENDPOINT}/${target}/${json.id}/md`);
            if (target === 'drafts') {
              router.replace(`/drafts?id=${json.id}`);
            } else {
              router.replace(`/${target}/${json.id}`);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="h-full px-1 py-2 bg-slate-100">
      <div className={classNames(styles.h44, 'flex gap-2')}>
        <div className="flex-1">
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-400 sm:text-sm sm:leading-6"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
      </div>
      <div className={classNames(styles.h50, 'flex gap-2')}>
        <div className="flex-1">
          <TopicSelector
            topics={form.Topics}
            onChange={(topics) => {
              setForm({ ...form, Topics: topics });
            }}
          />
        </div>
      </div>
      <div className={classNames(styles.h44, 'flex gap-2')}>
        <div className="flex-1">
          <GroupSelector
            groupId={groupId}
            onChange={(id: string) => {
              setForm({ ...form, group: { id: id } });
            }}
          />
        </div>
        <div className="bg-white ring-gray-300 border-0 ring-1 rounded-md mb-2 p-1 px-2 mr-0.5 flex gap-2 items-center">
          <PencilSquareIcon
            className={classNames(
              'h-6 w-6',
              editorMode === 'edit'
                ? 'text-indigo-600 bg-indigo-50 rounded-md'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-600 hover:cursor-pointer',
            )}
            aria-hidden="true"
            onClick={() => {
              setEditorMode('edit');
            }}
          />
          <ViewColumnsIcon
            className={classNames(
              'h-6 w-6',
              editorMode === 'both'
                ? 'text-indigo-600 bg-indigo-50 rounded-md'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-600 hover:cursor-pointer',
            )}
            aria-hidden="true"
            onClick={() => {
              setEditorMode('both');
            }}
          />
          <DocumentTextIcon
            className={classNames(
              'h-6 w-6',
              editorMode === 'preview'
                ? 'text-indigo-600 bg-indigo-50 rounded-md'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-600 hover:cursor-pointer',
            )}
            aria-hidden="true"
            onClick={() => {
              setEditorMode('preview');
            }}
          />
        </div>
      </div>
      <div className={classNames(styles.body, 'grid', 'mb-2', editorMode === 'both' ? 'grid-cols-2 gap-2' : 'grid-cols-1')}>
        <div className="w-full h-full" hidden={editorMode === 'preview'}>
          <DnDTextarea
            body={form.body}
            setBody={(body: string) => {
              setForm({ ...form, body: body });
              setRenderKey(!renderKey);
            }}
          />
        </div>
        <div
          className={classNames(
            styles.thinScrollbar,
            editorMode === 'edit' ? 'hidden' : 'block',
            'w-full rounded-md border-0 px-4 py-2 ring-1 ring-inset ring-gray-300 bg-white break-words overflow-y-scroll',
          )}
        >
          <Parser addHeaderAnchor={false} className={mdStyles.note}>
            {form.body}
          </Parser>
        </div>
      </div>
      <div className="flex justify-end">
        <SubmitButton
          defaultType={defaultSubmitButton}
          onChange={(type: any) => {
            //
          }}
          onSubmit={(type: any) => {
            if (type === 'publish') {
              handleSubmit('PUBLISHED');
            } else {
              handleSubmit('DRAFT');
            }
          }}
        />
      </div>
    </div>
  );
}
