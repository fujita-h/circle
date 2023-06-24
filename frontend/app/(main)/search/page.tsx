'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ItemList } from '@/components/items/list';

export default function Page() {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [query, setQuery] = useState(q);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data, isLoading, mutate } = useSWR<any[]>(`${environment.BACKEND_ENDPOINT}/items/search?q=${q}&skip=0&take=20`, fetcher, {
    revalidateOnFocus: false,
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/search?q=${query}`);
  };

  if (isLoading) {
    return <div>loading...</div>;
  }

  if (!data) {
    return <div>No Item</div>;
  }

  return (
    <div className="p-4">
      <h1>Search</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </form>
      <p>Search page</p>
      <ItemList items={data.map((x) => x._source)} />
    </div>
  );
}
