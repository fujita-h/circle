'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { LabelsLoader, ItemsLoader } from './loader';
import { StockLabel } from '@/types';

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoyParam = searchParams.get('category') || undefined;
  const pageParam = searchParams.get('page');
  const page = Number(pageParam) ? (Number(pageParam) > 0 ? Number(pageParam) : 1) : 1;
  const take = 20;

  const handleCategoryChange = (e?: StockLabel) => {
    const params = e ? new URLSearchParams({ category: e.id }) : new URLSearchParams();
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <div className="flex gap-6">
        <div className="w-72">
          <LabelsLoader activeLabelId={categoyParam} onChanged={handleCategoryChange} />
        </div>
        <div className="flex-1">
          <ItemsLoader labelId={categoyParam} pathname={pathname} page={page} take={take} />
        </div>
      </div>
    </>
  );
}
