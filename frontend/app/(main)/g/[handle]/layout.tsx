'use client';

import { BackendImage } from '@/components/backend-image';
import { useEnvironment } from '@/components/environment/providers';
import { JoinGroupConditionBadge, ReadNotePermissionBadge, WriteNotePermissionBadge } from '@/components/groups/badges';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { apiRequest } from '@/components/msal/requests';
import { NavigationTabs, TabItem } from '@/components/tabs';
import { Group, Membership, SomeRequired } from '@/types';
import { FollowGroup } from '@/types/follow-group';
import { classNames } from '@/utils';
import { useAccount, useMsal } from '@azure/msal-react';
import { Disclosure } from '@headlessui/react';
import { ChevronRightIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';

const inter = Inter({ subsets: ['latin'] });

export default function HandleWrapper({ params, children }: { params: any; children: React.ReactNode }) {
  const handle = params.handle;
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data, isLoading } = useSWR<SomeRequired<Group, '_count'>>(`${environment.BACKEND_ENDPOINT}/groups/handle/${handle}`, fetcher, {
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

function Layout({ group, children }: { group: SomeRequired<Group, '_count'>; children: React.ReactNode }) {
  const pathname = usePathname();
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { mutate } = useSWRConfig();

  const { data, isLoading } = useSWR<{ membership: Membership }>(
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
    { name: 'Notes', href: `/g/${group.handle}/notes`, current: false, count: group._count.Notes },
    { name: 'Members', href: `/g/${group.handle}/members`, current: false, count: group._count.Members },
  ];

  if (data?.membership?.role === 'ADMIN') {
    tabs.push({ name: 'Settings', href: `/g/${group.handle}/settings`, current: false });
  }

  return (
    <div>
      <div className="pt-4 bg-white ring-1 ring-gray-200">
        <div className="max-w-screen-2xl mx-auto">
          <div className="px-4 lg:px-8">
            <div className="py-8 px-4 lg:px-8">
              <div className="flex flex-col sm:flex-row gap-4 lg:gap-8">
                <div className="flex-none mx-auto">
                  <BackendImage
                    src={`/groups/${group.id}/photo`}
                    className="w-16 h-16 lg:w-24 lg:h-24 rounded-md border border-gray-200 bg-gray-50"
                    fallback={<UserGroupIcon className="w-24 h-24 rounded-full border border-gray-200 bg-gray-100 text-gray-400" />}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-center sm:text-left">
                    <span
                      className={classNames(
                        inter.className,
                        'mb-1 text-xl md:text-2xl lg:text-3xl font-semibold leading-7 text-gray-900 break-all  sm:tracking-tight',
                      )}
                    >
                      {group.name || group.handle}
                    </span>
                  </div>
                  {group.description ? (
                    <div className="flex justify-center sm:justify-normal">
                      <Disclosure>
                        {({ open }) => (
                          <>
                            <Disclosure.Button as="div" className="flex items-start min-w-0 hover:cursor-pointer">
                              <ChevronRightIcon
                                className={classNames('flex-none inline-block w-4 h-4 mt-1', open ? 'rotate-90 transform' : '')}
                              />
                              <p className={classNames('ml-[6px] flex-1 truncate', open ? 'hidden' : '')}>{group.description}</p>
                            </Disclosure.Button>
                            <Disclosure.Panel className="ml-4">
                              {({ close }) => (
                                <div
                                  className="hover:cursor-pointer"
                                  onClick={() => {
                                    close();
                                  }}
                                >
                                  {group.description}
                                </div>
                              )}
                            </Disclosure.Panel>
                          </>
                        )}
                      </Disclosure>
                    </div>
                  ) : (
                    <></>
                  )}
                  <div className="my-1 flex flex-wrap gap-2 justify-center sm:justify-normal">
                    <JoinGroupConditionBadge condition={group.joinGroupCondition} />
                    <WriteNotePermissionBadge permission={group.writeNotePermission} />
                    <ReadNotePermissionBadge permission={group.readNotePermission} />
                  </div>
                </div>
                <div className="flex-none">
                  <div className="flex flex-row sm:flex-col justify-center sm:justify-normal gap-4">
                    <JoinGroupButton
                      group={group}
                      membership={data?.membership}
                      onSuccess={() => {
                        mutate(`${environment.BACKEND_ENDPOINT}/groups/handle/${group.handle}`);
                        mutate(`${environment.BACKEND_ENDPOINT}/user/joined/groups/${group.id}`);
                        mutate(
                          (key) => typeof key === 'string' && key.startsWith(`${environment.BACKEND_ENDPOINT}/groups/${group.id}/members`),
                        );
                      }}
                    />
                    <FollowGroupButton group={group} />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4">
              <NavigationTabs tabs={tabs} />
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

function JoinGroupButton({ group, membership, onSuccess }: { group: Group; membership: Membership | undefined; onSuccess: () => void }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const handle = async (value: 'join' | 'leave') => {
    if (!account) return;
    const auth = await instance.acquireTokenSilent({
      account,
      scopes: apiRequest(environment).scopes,
    });
    const method = value === 'join' ? 'PUT' : 'DELETE';
    const response = await fetch(`${environment.BACKEND_ENDPOINT}/user/joined/groups/${group.id}`, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });

    if (response.ok) {
      onSuccess();
    }
  };

  if (membership?.role === 'PENDING_APPROVAL') {
    return (
      <button
        type="button"
        className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover: cursor-pointer"
        onClick={() => {
          handle('leave');
        }}
      >
        参加申請中
      </button>
    );
  } else if (membership?.role) {
    return (
      <button
        type="button"
        className="ml-3 inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-green-700 hover: cursor-pointer"
        onClick={() => {
          handle('leave');
        }}
      >
        グループに参加済み
      </button>
    );
  } else if (group.joinGroupCondition === 'DENIED') {
    return (
      <div className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover: cursor-not-allowed">
        グループに参加できません
      </div>
    );
  } else {
    return (
      <button
        type="button"
        className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover: cursor-pointer"
        onClick={() => {
          handle('join');
        }}
      >
        グループに参加する
      </button>
    );
  }
}

function FollowGroupButton({ group }: { group: Group }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);

  const { data, isLoading, mutate } = useSWR<FollowGroup>(`${environment.BACKEND_ENDPOINT}/user/following/groups/${group.id}`, fetcher, {
    revalidateOnFocus: false,
  });

  const handleClick = async (value: 'follow' | 'unfollow') => {
    if (!account) return;
    const auth = await instance.acquireTokenSilent({
      account,
      scopes: apiRequest(environment).scopes,
    });
    const method = value === 'follow' ? 'PUT' : 'DELETE';
    const response = await fetch(`${environment.BACKEND_ENDPOINT}/user/following/groups/${group.id}`, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });

    if (response.ok) {
      mutate();
    }
  };

  if (isLoading) {
    return <></>;
  }

  if (data?.groupId) {
    return (
      <button
        type="button"
        className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-indigo-700 hover: cursor-pointer"
        onClick={() => {
          handleClick('unfollow');
        }}
      >
        <div className="w-full text-center">フォロー中</div>
      </button>
    );
  } else {
    return (
      <button
        type="button"
        className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover: cursor-pointer"
        onClick={() => {
          handleClick('follow');
        }}
      >
        <div className="w-full text-center">フォロー</div>
      </button>
    );
  }
}
