import { classNames } from '@/utils';
import Link from 'next/link';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function Page() {
  return (
    <div>
      {/* Header area */}
      <div className="py-4 bg-white ring-1 ring-gray-200">
        <div className="max-w-screen-2xl mx-auto">
          <div className="px-4 lg:px-8">header area</div>
        </div>
      </div>

      <div className="bg-slate-100 print:bg-white">
        <div className="max-w-screen-2xl mx-auto">
          <div className="p-4 md:p-8">
            <div className="bg-white rounded-md p-4">
              <div className={classNames('text-xl font-bold text-center', inter.className)}>Dashbord Area</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
