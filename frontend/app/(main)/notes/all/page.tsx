'use client';

import { NotesCategoryHeader } from '@/components/notes/header';
import { usePathname, useSearchParams } from 'next/navigation';
import { itemTabs } from '../tab';
import { Loader } from './loader';

export default function Page() {
  // path and pagination data
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const page = Number(pageParam) ? (Number(pageParam) > 0 ? Number(pageParam) : 1) : 1;

  return (
    <>
      <NotesCategoryHeader title="Notes" tabs={itemTabs} />
      <div className="mt-6">
        <Loader pathname={pathname} page={page} take={20} />
      </div>
    </>
  );
}
