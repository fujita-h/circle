'use client';

import { useEnvironment } from '@/components/environment/providers';
import { apiRequest } from '@/components/msal/requests';
import { useAccount, useMsal } from '@azure/msal-react';
import { ChangeEvent, useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useRouter } from 'next/navigation';
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { SuccessAlert, FailedAlert } from './alert';
import { RadioGroupOption } from './radio-group-option';

type RadioGroupOptionItem = {
  name: string;
  description: string;
  value: string;
};

const PermissionReadItems: RadioGroupOptionItem[] = [
  { name: 'グループ管理者のみ', description: 'グループの管理者のみアイテムを閲覧できます。', value: 'ADMIN' },
  { name: 'グループメンバー', description: 'グループのメンバーがアイテムを閲覧できます。', value: 'GROUP_MEMBER' },
  { name: '誰でも', description: '誰でもこのグループのアイテムを閲覧できます。', value: 'ALL' },
];

const PermissionWriteItems: RadioGroupOptionItem[] = [
  { name: 'グループ管理者のみ', description: 'グループの管理者のみアイテムを投稿できます。', value: 'ADMIN' },
  { name: 'グループメンバー', description: 'グループのメンバーがアイテムを投稿できます。', value: 'GROUP_MEMBER' },
  { name: '誰でも', description: '誰でもこのグループにアイテムを投稿できます。', value: 'ALL' },
];

const ConditionWriteItems: RadioGroupOptionItem[] = [
  {
    name: '管理者の承認が必要',
    description: '投稿は保留状態になります。管理者が承認すると記事が投稿されます。',
    value: 'REQUIRE_ADMIN_APPROVAL',
  },
  { name: '投稿はすぐに反映', description: '投稿はすぐに公開されます。', value: 'NOT_REQUIRED' },
];

const conditionJoinGroups: RadioGroupOptionItem[] = [
  {
    name: '管理者の承認が必要',
    description: '参加を希望したユーザーは参加保留状態になります。管理者が承認するとグループに参加できます。',
    value: 'REQUIRE_ADMIN_APPROVAL',
  },
  { name: '誰でも参加できる', description: '誰でもグループに参加できます。', value: 'NOT_REQUIRED' },
];

export function UpdateGroupForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [formState, setFormState] = useState<any>(null);
  const [formUpdates, setFormUpdates] = useState<any>({});
  const [formLocked, setFormLocked] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [failedMessage, setFailedMessage] = useState('');

  const { mutate } = useSWRConfig();
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data, isLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/groups/${groupId}`, fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!data) {
      return;
    }
    setFormState(data);
  }, [data]);

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
          setSuccessMessage('更新が完了しました');
          setFormUpdates({});
          mutate(`${environment.BACKEND_ENDPOINT}/groups/${groupId}`);
          if (data.handle !== formState.handle) {
            router.replace(`/g/${formState.handle}/settings`);
          } else {
            mutate(`${environment.BACKEND_ENDPOINT}/groups/handle/${data.handle}`);
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
    setFormState({ ...formState, [e.target.name]: e.target.value });
    setFormUpdates({ ...formUpdates, [e.target.name]: e.target.value });
  };

  const handleRadioChange = (name: string, value: string) => {
    setSuccessMessage('');
    setFailedMessage('');
    setFormState({ ...formState, [name]: value });
    setFormUpdates({ ...formUpdates, [name]: value });
  };

  if (isLoading) {
    return <div>loading...</div>;
  }

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
                value={formState?.handle}
                disabled={formLocked}
                onChange={handleInputChange}
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-slate-400/40 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 disabled:bg-slate-100"
              />
            </div>
            <div className="mt-2 border-l-4 border-yellow-400 bg-yellow-50 p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    ハンドルを変更すると、グループのURLが変更されます。グループのリンクを共有している場合は、再度共有する必要があります。
                  </p>
                </div>
              </div>
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
                value={formState?.name}
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
                value={formState?.description}
                disabled={formLocked}
                onChange={handleInputChange}
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-slate-400/40 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="col-span-full">
            <RadioGroupOption
              label="アイテムの閲覧制限"
              name="readItemPermission"
              values={PermissionReadItems}
              value={formState?.readItemPermission}
              disabled={formLocked}
              onChange={handleRadioChange}
            />
          </div>

          <div className="col-span-full">
            <RadioGroupOption
              label="アイテムの投稿制限"
              name="writeItemPermission"
              values={PermissionWriteItems}
              value={formState?.writeItemPermission}
              disabled={formLocked}
              onChange={handleRadioChange}
            />
          </div>

          <div className="col-span-full">
            <RadioGroupOption
              label="アイテムの投稿条件"
              name="writeItemCondition"
              values={ConditionWriteItems}
              value={formState?.writeItemCondition}
              disabled={formLocked}
              onChange={handleRadioChange}
            />
          </div>

          <div className="col-span-full">
            <RadioGroupOption
              label="メンバーの加入設定"
              name={'joinCondition'}
              values={conditionJoinGroups}
              value={formState?.joinCondition}
              disabled={formLocked}
              onChange={handleRadioChange}
            />
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
              Save
            </button>
          </div>
          {successMessage ? <SuccessAlert message={successMessage} /> : <></>}
          {failedMessage ? <FailedAlert message={failedMessage} /> : <></>}
        </div>
      </div>
    </>
  );
}
