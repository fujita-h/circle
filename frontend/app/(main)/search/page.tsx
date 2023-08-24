'use client';

import { useEnvironment } from '@/components/environment/providers';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { CardList } from '@/components/notes';
import { LinkPagination } from '@/components/paginations';
import { classNames } from '@/utils';
import { useAccount, useMsal } from '@azure/msal-react';
import { Inter } from 'next/font/google';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import useSWR from 'swr';

const inter = Inter({ subsets: ['latin'] });

export default function Page() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  if (!q) {
    return <StartPage />;
  } else {
    return <ResultPage searchQuery={q} />;
  }
}

function StartPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query) {
      return;
    }
    router.push(`/search?q=${query}`);
  };
  return (
    <div className="p-8">
      <p className={classNames(inter.className, 'text-3xl font-bold mb-2')}>Search</p>
      <form onSubmit={handleSubmit}>
        <input
          autoFocus
          type="text"
          placeholder="Search"
          className="block w-full rounded-md border-0 bg-white px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-lg sm:leading-6"
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>
    </div>
  );
}

function ResultPage({ searchQuery }: { searchQuery: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const page = Number(pageParam) ? (Number(pageParam) > 0 ? Number(pageParam) : 1) : 1;
  const take = 20;
  const skip = (page - 1) * take;
  const [query, setQuery] = useState('');
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data: results, isLoading } = useSWR<{ data: any[]; meta: { total: number } }>(
    `${environment.BACKEND_ENDPOINT}/notes/search?q=${searchQuery}&take=${take}&skip=${skip}`,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query) {
      router.push(`/search`);
    }
    router.push(`/search?q=${query}`);
  };
  if (isLoading) {
    return <div>loading...</div>;
  }

  if (!results) {
    return <div>No Item or Error</div>;
  }

  return (
    <div className="p-8">
      <p className={classNames(inter.className, 'text-3xl font-bold mb-2')}>Search</p>
      <form onSubmit={handleSubmit}>
        <input
          autoFocus
          type="text"
          placeholder="Search"
          className="block w-full rounded-md border-0 bg-white px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-lg sm:leading-6"
          defaultValue={searchQuery}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>
      <div className="mt-6">
        <CardList notes={results.data.map((x) => x._source)} />
        <div className="py-5">
          <LinkPagination pathname={pathname} page={page} total={results.meta.total} take={take} query={`q=${searchQuery}`} />
        </div>
      </div>
    </div>
  );
}
