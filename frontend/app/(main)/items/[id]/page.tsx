'use client';

import useSWR from 'swr';
import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import Link from 'next/link';
import { RenderMDX } from '@/components/mdx';
import { capitalize, classNames } from '@/utils';
import { TypesColors } from '@/components/groups/type-colors';
import mdxStyles from '@/components/mdx/mdx-styles.module.css';

export default function Page({ params }: { params: any }) {
  const id = params.id;
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const jsonFetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const {
    data: item,
    error: itemError,
    isLoading: isItemLoading,
  } = useSWR(`${environment.BACKEND_ENDPOINT}/items/${id}`, jsonFetcher, {
    revalidateOnFocus: false,
  });
  const textFetcher = swrMsalTokenFetcher(instance, account, environment, 'text');
  const { data: markdown, isLoading: isMarkdownLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/items/${id}/md`, textFetcher, {
    revalidateOnFocus: false,
  });

  if (isItemLoading || isMarkdownLoading) {
    return <div>loading...</div>;
  }

  console.log(itemError);
  if (itemError) {
    return <div>no data</div>;
  }

  if (!item) {
    return <div>no data</div>;
  }

  return (
    <>
      <div>
        <div className="hidden sm:block">
          <Link className="text-sm font-medium text-gray-500 hover:text-gray-700" href={`/g/${item.group?.handle}`}>
            <div>
              <span
                className={classNames(
                  TypesColors[item.group.type],
                  'rounded-md whitespace-nowrap px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                )}
              >
                {capitalize(item.group.type)} Group
              </span>
              <span className="ml-2"> {item.group?.name} </span>
            </div>
          </Link>
        </div>
        {item.user.name}
        {item.createdAt}
      </div>

      <div className="mt-2 md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight"> {item.title} </h2>
        </div>
        <div className="mt-4 flex flex-shrink-0 md:ml-4 md:mt-0">
          {item.canEdit ? (
            <Link href={`/items/${item.id}/edit`}>
              <div className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:cursor-pointer">
                Edit
              </div>
            </Link>
          ) : (
            <></>
          )}
        </div>
      </div>
      <div className="mt-8">
        <div className={mdxStyles.mdx}>
          <RenderMDX source={markdown} />
        </div>
      </div>
    </>
  );
}
