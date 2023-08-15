'use client';

import { useEnvironment } from '@/components/environment/providers';
import { apiRequest } from '@/components/msal/requests';
import { useAccount, useMsal } from '@azure/msal-react';
import { ChangeEvent, useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useRouter } from 'next/navigation';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { SuccessAlert, FailedAlert, WarningWithAccent } from './alert';
import { RadioGroupOption } from './radio-group-option';
import { Group } from '@/types';

type RadioGroupOptionItem = {
  name: string;
  description: string;
  value: string;
};

const PermissionReadNotes: RadioGroupOptionItem[] = [
  { name: 'グループ管理者のみ', description: 'グループの管理者のみアイテムを閲覧できます。', value: 'ADMIN' },
  { name: 'グループメンバー', description: 'グループのメンバーがアイテムを閲覧できます。', value: 'MEMBER' },
  { name: '誰でも', description: '誰でもこのグループのアイテムを閲覧できます。', value: 'ALL' },
];

const PermissionWriteNotes: RadioGroupOptionItem[] = [
  { name: 'グループ管理者のみ', description: 'グループの管理者のみアイテムを投稿できます。', value: 'ADMIN' },
  { name: 'グループメンバー', description: 'グループのメンバーがアイテムを投稿できます。', value: 'MEMBER' },
  { name: '誰でも', description: '誰でもこのグループにアイテムを投稿できます。', value: 'ALL' },
];

const conditionJoinGroups: RadioGroupOptionItem[] = [
  {
    name: '参加を拒否',
    description: 'ユーザーからの参加を受け付けません。管理者がメンバーを追加することは制限されません。',
    value: 'DENIED',
  },
  {
    name: '管理者の承認が必要',
    description: '参加を希望したユーザーは参加保留状態になります。管理者が承認するとグループに参加できます。',
    value: 'REQUIRE_ADMIN_APPROVAL',
  },
  { name: '誰でも参加できる', description: '誰でもグループに参加できます。', value: 'ALLOWED' },
];

export function UpdateGroupForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [formUpdates, setFormUpdates] = useState<any>({});
  const [formLocked, setFormLocked] = useState(false);
  const [readNotePermission, setReadNotePermission] = useState(-1);
  const [writeNotePermission, setWriteNotePermission] = useState(-1);
  const [successMessage, setSuccessMessage] = useState('');
  const [failedMessage, setFailedMessage] = useState('');

  const { mutate } = useSWRConfig();
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data, isLoading } = useSWR<Group>(`${environment.BACKEND_ENDPOINT}/groups/${groupId}`, fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (data) {
      setReadNotePermission(PermissionReadNotes.findIndex((item) => item.value === data.readNotePermission));
      setWriteNotePermission(PermissionWriteNotes.findIndex((item) => item.value === data.writeNotePermission));
    }
  }, [data]);

  useEffect(() => {
    if (formUpdates.readNotePermission) {
      setReadNotePermission(PermissionReadNotes.findIndex((item) => item.value === formUpdates.readNotePermission));
    }
    if (formUpdates.writeNotePermission) {
      setWriteNotePermission(PermissionWriteNotes.findIndex((item) => item.value === formUpdates.writeNotePermission));
    }
  }, [formUpdates]);

  if (isLoading) {
    return <div>loading...</div>;
  }

  if (!data) {
    return <div>error</div>;
  }

  const handleClick = async () => {
    setSuccessMessage('');
    setFailedMessage('');
    if (account) {
      try {
        setFormLocked(true);
        const auth = await instance.acquireTokenSilent({
          account,
          scopes: apiRequest(environment).scopes,
        });
        const response = await fetch(`${environment.BACKEND_ENDPOINT}/groups/${groupId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.accessToken}`,
          },
          body: JSON.stringify({ ...formUpdates }),
        });
        if (response.ok) {
          const newData = await response.json();
          setSuccessMessage('更新が完了しました');
          setFormUpdates({});
          mutate(`${environment.BACKEND_ENDPOINT}/groups/${groupId}`);
          if (newData.handle === data.handle) {
            mutate(`${environment.BACKEND_ENDPOINT}/groups/handle/${data.handle}`);
          } else {
            router.replace(`/g/${newData.handle}/settings`);
          }
        } else {
          setFailedMessage('更新に失敗しました');
        }
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          setFailedMessage(e.message);
        } else if (typeof e === 'string') {
          setFailedMessage(e);
        } else {
          setFailedMessage('不明なエラー');
        }
      } finally {
        setFormLocked(false);
      }
    } else {
      setFailedMessage('認証エラー');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSuccessMessage('');
    setFailedMessage('');
    setFormUpdates({ ...formUpdates, [e.target.name]: e.target.value });
  };

  const handleRadioChange = (name: string, value: string) => {
    setSuccessMessage('');
    setFailedMessage('');
    setFormUpdates({ ...formUpdates, [name]: value });
  };

  const permissionMissmatch = readNotePermission >= 0 && writeNotePermission >= 0 && readNotePermission < writeNotePermission;

  return (
    <>
      <div className="md:col-span-2">
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:max-w-xl sm:grid-cols-6 lg:max-w-3xl">
          <div className="col-span-full lg:max-w-xl">
            <label htmlFor="handle" className="block text-base font-medium leading-6 text-gray-900">
              ハンドル
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="handle"
                id="handle"
                defaultValue={data.handle}
                disabled={formLocked}
                onChange={handleInputChange}
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-slate-400/40 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 disabled:bg-slate-100"
              />
            </div>
            <div className="mt-2">
              <WarningWithAccent message="ハンドルを変更すると、グループのURLが変更されます。グループのリンクを共有している場合は、再度共有する必要があります。" />
            </div>
          </div>

          <div className="col-span-full lg:max-w-xl">
            <label htmlFor="name" className="block text-base font-medium leading-6 text-gray-900">
              グループ名
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="name"
                id="name"
                defaultValue={data.name}
                disabled={formLocked}
                onChange={handleInputChange}
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-slate-400/40 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="col-span-full">
            <label htmlFor="description" className="block text-base font-medium leading-6 text-gray-900">
              グループの説明
            </label>
            <div className="mt-2">
              <textarea
                name="description"
                id="description"
                rows={5}
                defaultValue={data.description}
                disabled={formLocked}
                onChange={handleInputChange}
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-slate-400/40 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="col-span-full">
            <RadioGroupOption
              label="メンバーの加入"
              name={'joinGroupCondition'}
              values={conditionJoinGroups}
              defaultValue={data.joinGroupCondition}
              disabled={formLocked}
              onChange={handleRadioChange}
            />
          </div>

          <div className="col-span-full">
            <RadioGroupOption
              label="ノートの投稿制限"
              name="writeNotePermission"
              values={PermissionWriteNotes}
              defaultValue={data.writeNotePermission}
              disabled={formLocked}
              onChange={handleRadioChange}
            />
          </div>

          <div className="col-span-full">
            <RadioGroupOption
              label="ノートの閲覧制限"
              name="readNotePermission"
              values={PermissionReadNotes}
              defaultValue={data.readNotePermission}
              disabled={formLocked}
              onChange={handleRadioChange}
            />
            {permissionMissmatch ? (
              <div className="mt-2">
                <WarningWithAccent message="ノートの閲覧制限が投稿制限よりも強く設定されています。通常、閲覧制限は投稿設定と同じかそれより弱く設定します。" />
              </div>
            ) : (
              <> </>
            )}
          </div>
        </div>

        <div className="mt-8 flex space-x-4">
          <div>
            <button
              type="button"
              disabled={formLocked || Object.keys(formUpdates).length === 0}
              onClick={handleClick}
              className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:bg-opacity-50 disabled:cursor-not-allowed"
            >
              グループ設定を反映
            </button>
          </div>
          {successMessage ? <SuccessAlert message={successMessage} /> : <></>}
          {failedMessage ? <FailedAlert message={failedMessage} /> : <></>}
        </div>
      </div>
    </>
  );
}
