'use client';

import { useEnvironment } from '@/components/environment/providers';
import { ReadNotePermissionBadge } from '@/components/groups/badges';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import { useAccount, useMsal } from '@azure/msal-react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import { Fragment, useEffect, useState } from 'react';
import useSWR from 'swr';

export function GroupSelector({ groupId, onChange }: { groupId?: string; onChange?: Function }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [selected, setSelected] = useState<any>({});
  const fetcher = swrMsalTokenFetcher(instance, account, environment);
  const { data, isLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/user/groups/postable`, fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!data) return;
    const sel = data.find((group: any) => group.id === groupId);
    if (sel) {
      setSelected(sel);
    } else {
      setSelected({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (onChange) onChange(selected?.id || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Listbox value={selected} onChange={setSelected}>
      {({ open }) => (
        <>
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
              <span className="block truncate space-x-2">
                <span>{selected?.name || selected?.id || '未設定'}</span>
                <ReadNotePermissionBadge permission={selected.readNotePermission} />
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition show={open} as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <Listbox.Option
                  key={'draft'}
                  className={({ active }) =>
                    clsx(active ? 'bg-indigo-600 text-white' : 'text-gray-900', 'relative cursor-default select-none py-2 pl-3 pr-9')
                  }
                  value={{}}
                >
                  {({ selected, active }) => (
                    <>
                      <span className={clsx(selected ? 'font-semibold' : 'font-normal', 'block truncate')}> {'未設定'} </span>
                      {selected ? (
                        <span
                          className={clsx(active ? 'text-white' : 'text-indigo-600', 'absolute inset-y-0 right-0 flex items-center pr-4')}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
                {data?.map((group: any) => (
                  <Listbox.Option
                    key={group.id}
                    className={({ active }) =>
                      clsx(active ? 'bg-indigo-600 text-white' : 'text-gray-900', 'relative cursor-default select-none py-2 pl-3 pr-9')
                    }
                    value={group}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={clsx(selected ? 'font-semibold' : 'font-normal', 'block truncate space-x-2')}>
                          <span>{group.name || group.id}</span>
                          <ReadNotePermissionBadge permission={group.readNotePermission} />
                        </span>
                        {selected ? (
                          <span
                            className={clsx(active ? 'text-white' : 'text-indigo-600', 'absolute inset-y-0 right-0 flex items-center pr-4')}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}
