import clsx from 'clsx';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-100 print:bg-white border-t border-gray-200">
      <div className="max-w-screen-2xl mx-auto">
        <div className="rounded-md p-8">
          <div className="px-4">
            <div className="ml-1">
              <p className={clsx(inter.className, 'text-3xl font-bold')}>Stocks</p>
              <p className="text-base text-gray-500">ストック</p>
            </div>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
