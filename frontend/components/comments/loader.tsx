'use client';

import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { apiRequest } from '@/components/msal/requests';
import { Parser } from '@/components/react-markdown/parser';
import mdStyles from '@/components/react-markdown/styles.module.css';
import { useAccount, useMsal } from '@azure/msal-react';
import { Tab } from '@headlessui/react';
import clsx from 'clsx';
import { useState } from 'react';
import useSWR from 'swr';
import { CommentList } from './list';

export function Loader({ noteId }: { noteId: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const [commentTabIndex, setCommentTabIndex] = useState(0); // 0: write, 1: preview
  const [comment, setComment] = useState('');

  const take = 999;
  const skip = 0;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!comment) return;
    if (!account) return;
    try {
      const auth = await instance.acquireTokenSilent({
        account,
        scopes: apiRequest(environment).scopes,
      });
      const response = await fetch(`${environment.BACKEND_ENDPOINT}/notes/${noteId}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: comment }),
      });
      if (response.ok) {
        setComment('');
        setCommentTabIndex(0);
        commentsMutate();
      }
    } catch (error) {
      console.log(error);
    }
  };

  // fetch data
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const {
    data: comments,
    isLoading: isDataLoading,
    mutate: commentsMutate,
  } = useSWR<{ data: any[]; meta: { total: number } }>(`${environment.BACKEND_ENDPOINT}/notes/${noteId}/comments`, fetcher, {
    revalidateOnFocus: false,
  });

  if (isDataLoading) {
    return <div>loading...</div>;
  }

  if (!comments) {
    return <div>Error...</div>;
  }

  return (
    <div>
      <div>
        <div>
          <h2 className="text-xl font-bold ml-1">コメント</h2>
        </div>
        <div className="mt-3">
          <CommentList comments={comments.data} />
        </div>
      </div>

      <form className="mt-8" onSubmit={handleSubmit}>
        <Tab.Group selectedIndex={commentTabIndex} onChange={setCommentTabIndex}>
          <Tab.List className="flex items-center">
            <Tab
              className={({ selected }) =>
                clsx(
                  selected ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900',
                  'rounded-md border border-transparent px-3 py-1.5 text-sm font-medium',
                )
              }
            >
              Write
            </Tab>
            <Tab
              className={({ selected }) =>
                clsx(
                  selected ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900',
                  'ml-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium',
                )
              }
            >
              Preview
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-2">
            <Tab.Panel className="-m-0.5 rounded-lg p-0.5">
              <label htmlFor="comment" className="sr-only">
                Comment
              </label>
              <div>
                <textarea
                  rows={5}
                  name="comment"
                  id="comment"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Add your comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </Tab.Panel>
            <Tab.Panel className="-m-0.5 rounded-lg p-0.5">
              <div className="w-full rounded-md border-0 ring-1 ring-inset ring-gray-300 py-2 px-3 min-h-[132px]">
                <Parser addHeaderAnchor={false} className={mdStyles.comment}>
                  {comment}
                </Parser>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
}
