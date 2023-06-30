'use client';

export function Pagination({ page, setPage, total, take }: { page: number; setPage: (page: number) => void; total: number; take: number }) {
  const startItem = total === 0 ? 0 : (page - 1) * take + 1;
  const endItem = Math.min(page * take, total);
  const prevPage = page - 1 > 1 ? page - 1 : 1;
  const nextPage = page + 1 < Math.ceil(total / take) ? page + 1 : Math.ceil(total / take);
  return (
    <>
      <nav className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6" aria-label="Pagination">
        <div className="hidden sm:block">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{total}</span> results
          </p>
        </div>
        <div className="flex flex-1 justify-between sm:justify-end">
          {page == prevPage ? (
            <span className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 hover:cursor-pointer">
              Previous
            </span>
          ) : (
            <span
              onClick={() => {
                setPage(prevPage);
              }}
              className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 hover:cursor-pointer"
            >
              Previous
            </span>
          )}
          {page == nextPage ? (
            <span className="relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 hover:cursor-pointer">
              Next
            </span>
          ) : (
            <span
              onClick={() => {
                setPage(nextPage);
              }}
              className="relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 hover:cursor-pointer"
            >
              Next
            </span>
          )}
        </div>
      </nav>
    </>
  );
}
