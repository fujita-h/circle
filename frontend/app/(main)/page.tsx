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
            <div className="bg-white rounded-md p-4">
              <div className={classNames('text-xl font-bold text-center', inter.className)}>Dashbord Area</div>
            </div>
            <Loader cat="weekly" take={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
