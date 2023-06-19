'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Page() {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [query, setQuery] = useState(q);

  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data, isLoading, mutate } = useSWR<any[]>(`${environment.BACKEND_ENDPOINT}/items/search?q=${q}&skip=0&take=20`, fetcher, {
    revalidateOnFocus: false,
    suspense: true,
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/search?q=${query}`);
  };

  return (
    <div className="p-4">
      <h1>Search</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </form>
      <p>Search page</p>
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          {data?.map((x) => {
            return (
              <div key={x._id} className="flex gap-2">
                <div>
                  <Link href={`/items/${x._id}`}> {x._id}</Link>
                </div>
                <div>{x._index}</div>
              </div>
            );
          })}
        </div>
      </Suspense>
    </div>
  );
}
