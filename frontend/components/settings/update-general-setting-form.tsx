'use client';

import { useEnvironment } from '@/components/environment/providers';
import { apiRequest } from '@/components/msal/requests';
import { useAccount, useMsal } from '@azure/msal-react';
import { ChangeEvent, useState } from 'react';
import useSWR from 'swr';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { SelectMenu, SelectMenuOption } from './select-menu-option';

const listNotesStyleOptions: SelectMenuOption[] = [
  { id: 'CARD', name: 'カード形式' },
  { id: 'LIST', name: 'リスト形式' },
];

export function UpdateGeneralSettingForm() {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [formUpdates, setFormUpdates] = useState({});
  const [formLocked, setFormLocked] = useState(false);

  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data, isLoading, mutate } = useSWR(`${environment.BACKEND_ENDPOINT}/user/setting`, fetcher, {
    revalidateOnFocus: false,
  });

  const handlePatch = async (key: string, value: string) => {
    if (account) {
      try {
        setFormLocked(true);
        const auth = await instance.acquireTokenSilent({
          account,
          scopes: apiRequest(environment).scopes,
        });
        const response = await fetch(`${environment.BACKEND_ENDPOINT}/user/setting`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.accessToken}`,
          },
          body: JSON.stringify({ [key]: value }),
        });
        if (response.ok) {
          mutate();
        } else {
          console.error(await response.text());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setFormLocked(false);
      }
    }
  };

  if (isLoading) {
    return <></>;
  }

  return (
    <>
      <div className="md:col-span-2">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
          <div className="col-span-full">
            <SelectMenu
              label="ノート一覧の表示形式"
              options={listNotesStyleOptions}
              defaultValue={listNotesStyleOptions.find((o) => o.id === data?.listNotesStyle)}
              disabled={formLocked}
              onChange={(e) => {
                handlePatch('listNotesStyle', e.id);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
