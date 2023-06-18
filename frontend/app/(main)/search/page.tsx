'use client';

import { useSearchParams } from 'next/navigation';

export default function Page() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  return (
    <div className="p-4">
      <h1>Search</h1>
      <input type="text" placeholder="Search" defaultValue={q} />
      <p>Search page</p>
    </div>
  );
}
