'use client';

import { Viewer } from '@/components/drafts/viewer';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader } from './loader';

export default function Page() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const page = Number(pageParam) ? (Number(pageParam) > 0 ? Number(pageParam) : 1) : 1;

  const id = searchParams.get('id') || undefined;
  return (
    <>
      <div className="flex gap-6">
        <div className="w-96">
          <Loader pathname={pathname} page={page} take={10} activeDraftId={id} />
        </div>
        <div className="flex-1">{id ? <Viewer noteId={id} /> : <></>}</div>
      </div>
    </>
  );
}
