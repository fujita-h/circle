import { Suspense } from 'react';
import { UpdateProfileForm } from '@/components/settings/update-profile-form';
import { UpdatePhotoForm } from '@/components/settings/update-photo-form';
import { LogoutButton } from '@/components/msal/logout-button';

const secondaryNavigation = [
  { name: 'Account', href: '#', current: true },
  { name: 'Notifications', href: '#', current: false },
  { name: 'Billing', href: '#', current: false },
  { name: 'Teams', href: '#', current: false },
  { name: 'Integrations', href: '#', current: false },
];

export default function Page() {
  return (
    <>
      <header className="border-b border-white/5">
        {/* Secondary navigation */}
        <nav className="flex overflow-x-auto py-4">
          <ul role="list" className="flex min-w-full flex-none gap-x-6 px-4 text-sm font-semibold leading-6 text-gray-400 sm:px-6 lg:px-8">
            {secondaryNavigation.map((item) => (
              <li key={item.name}>
                <a href={item.href} className={item.current ? 'text-indigo-400' : ''}>
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Image Form */}
      <div className="divide-y divide-white/5">
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">アイコン画像</h2>
            <p className="mt-1 text-sm leading-6 text-gray-400">アイコン画像を変更します。</p>
          </div>
          <Suspense fallback={<div>Loading...</div>}>
            <UpdatePhotoForm />
          </Suspense>
        </div>
      </div>

      {/* Profile forms */}
      <div className="divide-y divide-white/5">
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">Personal Information</h2>
            <p className="mt-1 text-sm leading-6 text-gray-400">Use a permanent address where you can receive mail.</p>
          </div>
          <Suspense fallback={<div>Loading...</div>}>
            <UpdateProfileForm />
          </Suspense>
        </div>

        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">サインアウト</h2>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              このWebアプリケーションはシングルサオンによってユーザーを認証しているため、明示的にサインアウトをする必要はありません。
              サインアウトを実行すると、全ての Azure AD アプリケーションからサインアウトします。これは、同じ Auzre AD
              アカウントを用いて認証している他のWebサイトからもサインアウトされることを意味します。
            </p>
          </div>

          <form className="flex items-start md:col-span-2">
            <LogoutButton className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-400">
              全ての Azure AD アプリケーションからサインアウト
            </LogoutButton>
          </form>
        </div>

        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">アカウントの削除</h2>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              No longer want to use our service? You can delete your account here. This action is not reversible. All information related to
              this account will be deleted permanently.
            </p>
          </div>

          <form className="flex items-start md:col-span-2">
            <button
              disabled
              type="submit"
              className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-400"
            >
              Yes, delete my account
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
