import { navTabItems } from '@/app/(main)/nav-tab-items';
import { NavigationTabs } from '@/components/tabs';
import { classNames } from '@/utils';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Loader as GroupsLoader } from './groups/explore/loader';
import { Loader as NotesLoader } from './notes/explore/loader';

const inter = Inter({ subsets: ['latin'] });

export default function Page() {
  return (
    <div>
      {/* Header area */}
      <div className="pt-1 bg-white">
        <div className="max-w-screen-2xl mx-auto">
          <div className="pt-2 lg:pt-0 px-6 lg:px-8">
            <NavigationTabs tabs={navTabItems} />
          </div>
        </div>
      </div>

      <div className="bg-slate-100 print:bg-white border-t border-gray-200">
        <div className="max-w-screen-2xl mx-auto">
          <div className="p-4 md:p-8 space-y-12">
            <div className="px-4">
              <div className="ml-1">
                <p className={classNames(inter.className, 'text-3xl font-bold')}>Notes</p>
                <p className="text-base text-gray-500">注目されている記事</p>
              </div>
              <div className="mt-6">
                <NotesLoader cat="weekly" take={12} />
              </div>
              <div className="mt-6 flex justify-center">
                <Link href="/notes/explore" className="text-lg text-indigo-700 hover:text-indigo-500 hover:underline underline-offset-2">
                  記事をもっと見る
                </Link>
              </div>
            </div>
            <div className="px-4">
              <div className="ml-1">
                <p className={classNames(inter.className, 'text-3xl font-bold')}>Groups</p>
                <p className="text-base text-gray-500">注目されているグループ</p>
              </div>
              <div className="mt-6">
                <GroupsLoader cat="weekly" take={12} />
              </div>
              <div className="mt-6 flex justify-center">
                <Link href="/groups/explore" className="text-lg text-indigo-700 hover:text-indigo-500 hover:underline underline-offset-2">
                  グループをもっと見る
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
