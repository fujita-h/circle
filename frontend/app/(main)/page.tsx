import { classNames } from '@/utils';
import { Inter } from 'next/font/google';
import { LargeTabs } from '@/components/tabs';
import { secondaryTabItems } from '@/components/navbar';
import { Loader } from './loader';

const inter = Inter({ subsets: ['latin'] });

export default function Page() {
  return (
    <div>
      {/* Header area */}
      <div className="pt-1 bg-white">
        <div className="max-w-screen-2xl mx-auto">
          <div className="pt-2 lg:pt-0 px-6 lg:px-8">
            <LargeTabs tabs={secondaryTabItems} />
          </div>
        </div>
      </div>

      <div className="bg-slate-100 print:bg-white border-t border-gray-200">
        <div className="max-w-screen-2xl mx-auto">
          <div className="p-4 md:p-8">
            <div className="px-4">
              <div className="ml-1">
                <p className={classNames(inter.className, 'text-3xl font-bold')}>Trending</p>
                <p className="text-base text-gray-500">注目されている記事</p>
              </div>
              <div className="mt-6">
                <Loader cat="weekly" take={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
