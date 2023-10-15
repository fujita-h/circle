'use client';

import clsx from 'clsx';
import { Fragment, useEffect, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid';

export interface SelectMenuOption {
  id: string;
  name: string;
}

export function SelectMenu({
  label,
  options,
  defaultValue,
  disabled,
  onChange,
}: {
  label?: string;
  options: SelectMenuOption[];
  defaultValue?: SelectMenuOption;
  disabled?: boolean;
  onChange?: (value: SelectMenuOption) => void;
}) {
  const [selected, setSelected] = useState(options.find((o) => o.id === defaultValue?.id) || options[0] || undefined);

  const handleListboxChanged = (value: SelectMenuOption) => {
    setSelected(value);
    if (onChange) {
      onChange(value);
    }
  };

  if (options.length === 0) {
    console.error('SelectMenu: values must not be empty');
    return <></>;
  }

  return (
    <Listbox value={selected} onChange={handleListboxChanged} disabled={disabled}>
      {({ open }) => (
        <>
          <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">{label}</Listbox.Label>
          <div className="relative mt-2">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
              <span className="block truncate">{selected.name}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition show={open} as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {options.map((option) => (
                  <Listbox.Option
                    key={option.id}
                    className={({ active }) =>
                      clsx(active ? 'bg-indigo-600 text-white' : 'text-gray-900', 'relative cursor-default select-none py-2 pl-3 pr-9')
                    }
                    value={option}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={clsx(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>{option.name}</span>

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
