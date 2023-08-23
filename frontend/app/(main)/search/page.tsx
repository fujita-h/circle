'use client';

import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { CardList } from '@/components/notes';
import { useAccount, useMsal } from '@azure/msal-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import useSWR from 'swr';

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
  const { data, isLoading, mutate } = useSWR<any[]>(`${environment.BACKEND_ENDPOINT}/notes/search?q=${q}&skip=0&take=20`, fetcher, {
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
    return <div>No Item or Error</div>;
  }

  return (
    <div className="p-4">
      <h1>Search</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search"
          className="block w-full rounded-md border-0 bg-white py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>
      <div className="mt-4">
        <h2>Results:</h2>
        <CardList notes={data.map((x) => x._source)} />
      </div>
    </div>
  );
}
