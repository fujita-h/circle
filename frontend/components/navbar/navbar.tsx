'use client';

import { BackendImage } from '@/components/backend-image';
import { useEnvironment } from '@/components/environment/providers';
import { classNames } from '@/utils';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/20/solid';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment } from 'react';
import { UserEmail, UserName } from './user-data';

const inter = Inter({ subsets: ['latin'] });
const navigation: any[] = [];
const userNavigation = [
  { name: 'Drafts', href: '/drafts' },
  { name: 'Settings', href: '/settings' },
];

export function Navbar() {
  const environment = useEnvironment();
  const router = useRouter();

  return (
    <Disclosure as="nav" className="bg-white">
      {({ open }) => (
        <>
          <div className="mx-auto px-2 sm:px-4 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex px-2 lg:px-0">
                <div className="flex flex-shrink-0 items-center">
                  <Link href="/">
                    <div className="flex items-center gap-2">
                      <div>
                        <Image src="/assets/images/circle_logo.png" alt="logo" width={32} height={32} />
                      </div>
                      <div className="pt-3">
                        <span className={classNames('text-xl text-gray-700 font-semibold', inter.className)}>
                          {environment.WEBSITE_NAME}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium',
                        item.current ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700',
                      )}
                      aria-current={item.current ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center lg:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="hidden lg:ml-4 lg:flex lg:items-center lg:gap-1">
                <Link
                  href="/search"
                  className="flex-shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Search</span>
                  <MagnifyingGlassIcon className="h-7 w-7" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  className="flex-shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-7 w-7" aria-hidden="true" />
                </button>
                {/* Profile dropdown */}
                <Menu as="div" className="ml-1 relative flex-shrink-0">
                  <div>
                    <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                      <span className="sr-only">Open user menu</span>
                      <BackendImage
                        src="/user/photo"
                        className="h-8 w-8 rounded-full"
                        alt="user-icon"
                        fallback={<UserIcon className="h-8 w-8 rounded-full bg-gray-100 text-gray-400" />}
                      />
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {userNavigation.map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) => (
                            <Link
                              href={item.href}
                              className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm font-semibold text-gray-600')}
                            >
                              {item.name}
                            </Link>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </Menu>
                <Link href="/drafts/new">
                  <div className="ml-2 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 hover:cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                    投稿する
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="lg:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Disclosure.Button
                    as="span"
                    className={classNames(
                      'block border-l-4 py-2 pl-3 pr-4 text-base font-medium',
                      item.current
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800',
                      ' ',
                    )}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                </Link>
              ))}
            </div>
            <div className="border-t border-gray-200 pb-3 pt-4">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <BackendImage src="/user/photo" className="h-10 w-10 rounded-full" alt="user-icon" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    <UserName />
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    <UserEmail />
                  </div>
                </div>
                <div className="ml-auto flex-shrink-0 flex gap-2">
                  <Link
                    href="/search"
                    className=" rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">Search</span>
                    <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {userNavigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <Disclosure.Button
                      as="span"
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    >
                      {item.name}
                    </Disclosure.Button>
                  </Link>
                ))}
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
