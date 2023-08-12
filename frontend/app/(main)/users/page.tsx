'use client';

import { classNames } from '@/utils';
import { Inter } from 'next/font/google';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader } from './loader';

const inter = Inter({ subsets: ['latin'] });

export default function Page() {
  // path and pagination data
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const page = Number(pageParam) ? (Number(pageParam) > 0 ? Number(pageParam) : 1) : 1;

  return (
    <div className="bg-slate-100 print:bg-white border-t border-gray-200">
      <div className="max-w-screen-2xl mx-auto">
        <div className="p-4 md:p-8">
          <div className="px-4">
            <div className="ml-1">
              <p className={classNames(inter.className, 'text-3xl font-bold')}>Users</p>
              <p className="text-base text-gray-500">全てのユーザー</p>
            </div>
            <div className="mt-6">
              <Loader pathname={pathname} page={page} take={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
