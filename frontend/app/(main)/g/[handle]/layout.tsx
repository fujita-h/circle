'use client';

import Link from 'next/link';
import { Inter } from 'next/font/google';
import { classNames, capitalize } from '@/utils';
import { useAccount, useMsal } from '@azure/msal-react';
import { useEnvironment } from '@/components/environment/providers';
import { LargeTabs, TabItem } from '@/components/tabs';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import useSWR from 'swr';
import {
  ReadNotePermissionBadge,
  WriteNotePermissionBadge,
  WriteNoteConditionBadge,
  JoinGroupConditionBadge,
} from '@/components/groups/badges';
import { apiRequest } from '@/components/msal/requests';
import { Group, Membership } from '@/types';
import { BackendImage } from '@/components/backend-image';

const inter = Inter({ subsets: ['latin'] });

export default function HandleWrapper({ params, children }: { params: any; children: React.ReactNode }) {
  const handle = params.handle;
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data, isLoading, mutate } = useSWR<Group>(`${environment.BACKEND_ENDPOINT}/groups/handle/${handle}`, fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return <></>;
  }

  if (!data) {
    return <>Group Not Found</>;
  }

  return <Layout group={data}>{children}</Layout>;
}

function Layout({ group, children }: { group: Group; children: React.ReactNode }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);

  const { data, isLoading, mutate } = useSWR<{ membership: Membership }>(
    `${environment.BACKEND_ENDPOINT}/user/joined/groups/${group.id}`,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  if (isLoading) {
    return <div>loading...</div>;
  }

  const tabs: TabItem[] = [
    { name: 'Notes', href: `/g/${group.handle}/notes`, current: false },
    { name: 'Members', href: `/g/${group.handle}/members`, current: false },
  ];

  if (data?.membership?.role === 'ADMIN') {
    tabs.push({ name: 'Settings', href: `/g/${group.handle}/settings`, current: false });
  }

  return (
    <div>
      <div className="pt-4 bg-white ring-1 ring-gray-200">
        <div className="max-w-screen-2xl mx-auto">
          <div className="px-4 lg:px-8">
            <div className="py-8 px-12">
              <div className="flex gap-8">
                <div className="flex-none">
                  <BackendImage src={`/groups/${group.id}/photo`} className="w-24 h-24 rounded-md border border-gray-200" />
                </div>
                <div className="flex-1">
                  <div>
                    <span
                      className={classNames(
                        inter.className,
                        'mb-1 text-2xl font-semibold leading-7 text-gray-900 break-all sm:text-3xl sm:tracking-tight',
                      )}
                    >
                      {group.name || group.handle}
                    </span>
                  </div>
                  <div>
                    <span>{group.description}</span>
                  </div>
                  <div className="mb-1 flex flex-wrap gap-2">
                    <ReadNotePermissionBadge permission={group.readNotePermission} />
                    <WriteNotePermissionBadge permission={group.writeNotePermission} />
                    <WriteNoteConditionBadge condition={group.writeNoteCondition} />
                    <JoinGroupConditionBadge condition={group.joinGroupCondition} />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4">
              <LargeTabs tabs={tabs} />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-slate-100 print:bg-white border-t border-gray-200">
        <div className="max-w-screen-2xl mx-auto">
          <div className="p-4 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

function JoinGroupButton({ groupId, onSuccess }: { groupId: string; onSuccess: () => void }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const handleJoin = async () => {
    if (!account) return;
    const auth = await instance.acquireTokenSilent({
      account,
      scopes: apiRequest(environment).scopes,
    });
    const response = await fetch(`${environment.BACKEND_ENDPOINT}/user/joined/groups/${groupId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });

    if (response.ok) {
      onSuccess();
    }
  };

  return (
    <button
      type="button"
      className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover: cursor-pointer"
      onClick={handleJoin}
    >
      このグループに参加する
    </button>
  );
}
