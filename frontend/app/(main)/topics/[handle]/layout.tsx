'use client';

import { BackendImage } from '@/components/backend-image';
import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { apiRequest } from '@/components/msal/requests';
import { NavigationTabs, TabItem } from '@/components/tabs';
import { Topic, TopicMap } from '@/types';
import { useAccount, useMsal } from '@azure/msal-react';
import { UserIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { Inter } from 'next/font/google';
import useSWR from 'swr';

const inter = Inter({ subsets: ['latin'] });

export default function HandleWrapper({ params, children }: { params: any; children: React.ReactNode }) {
  const handle = params.handle;
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: topic, isLoading } = useSWR<Topic>(`${environment.BACKEND_ENDPOINT}/topics/handle/${handle}`, fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return <div>loading...</div>;
  }

  if (!topic) {
    return <div>Not Found</div>;
  }

  return <Layout topic={topic}>{children}</Layout>;
}

function Layout({ topic, children }: { topic: Topic; children: React.ReactNode }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);

  const { data: statistics } = useSWR<{ _count: { notes: number; users: number } }>(
    `${environment.BACKEND_ENDPOINT}/topics/${topic.id}/statistics`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const tabs: TabItem[] = [
    { name: 'Notes', href: `/topics/${topic.handle}/notes`, current: false, count: statistics?._count.notes || undefined },
    { name: 'Users', href: `/topics/${topic.handle}/users`, current: false, count: statistics?._count.users || undefined },
  ];

  return (
    <div>
      <div className="pt-4 bg-white ring-1 ring-gray-200">
        <div className="max-w-screen-2xl mx-auto">
          <div className="px-4 lg:px-8">
            <div className="py-8 px-12">
              <div className="flex gap-8">
                <div className="flex-none">
                  <BackendImage
                    src={`/topics/${topic.id}/photo`}
                    className="w-24 h-24 rounded-full border border-gray-200 bg-gray-50"
                    fallback={<UserIcon className="w-24 h-24 rounded-full border border-gray-200 bg-gray-100 text-gray-400" />}
                  />
                </div>
                <div className="flex-1">
                  <div>
                    <span
                      className={clsx(
                        inter.className,
                        'mb-1 text-2xl font-semibold leading-7 text-gray-900 break-all sm:text-3xl sm:tracking-tight',
                      )}
                    >
                      {topic.name || topic.handle}
                    </span>
                  </div>
                  <div>
                    <span> </span>
                  </div>
                </div>
                <div className="flex-none">
                  <div className="flex flex-row sm:flex-col justify-center sm:justify-normal gap-4">
                    <FollowTopicButton topic={topic} />
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

function FollowTopicButton({ topic }: { topic: Topic }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data, isLoading, mutate } = useSWR<TopicMap>(`${environment.BACKEND_ENDPOINT}/user/following/topics/${topic.id}`, fetcher, {
    revalidateOnFocus: false,
  });

  const handleClick = async (action: 'follow' | 'unfollow') => {
    if (!account) return;
    const auth = await instance.acquireTokenSilent({
      account,
      scopes: apiRequest(environment).scopes,
    });
    const method = action === 'follow' ? 'PUT' : 'DELETE';
    const response = await fetch(`${environment.BACKEND_ENDPOINT}/user/following/topics/${topic.id}`, {
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

  if (data?.topicId) {
    return (
      <button
        type="button"
        className="min-w-[120px] ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-indigo-700 hover: cursor-pointer"
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
        className="min-w-[120px] ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover: cursor-pointer"
        onClick={() => {
          handleClick('follow');
        }}
      >
        <div className="w-full text-center">フォロー</div>
      </button>
    );
  }
}
