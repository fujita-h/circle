'use client';

import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/20/solid';
import { classNames } from '@/utils';

export function RadioGroupOption({
  label,
  name,
  values,
  defaultValue,
  disabled,
  onChange,
}: {
  label: string;
  name: string;
  values: any[];
  defaultValue: string;
  disabled: boolean;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <RadioGroup
      defaultValue={defaultValue}
      disabled={disabled}
      onChange={(e) => {
        onChange(name, e);
      }}
    >
      <RadioGroup.Label className="block text-base font-medium leading-6 text-gray-900">{label}</RadioGroup.Label>
      <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 xl:grid-cols-3 sm:gap-x-4">
        {values.map((v: any) => (
          <RadioGroup.Option
            key={v.value}
            value={v.value}
            className={({ active }) =>
              classNames(
                active ? 'border-indigo-600 ring-2 ring-indigo-600' : 'border-gray-300',
                'relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none',
              )
            }
          >
            {({ checked, active }) => (
              <>
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <RadioGroup.Label as="span" className="block text-sm font-medium text-gray-900">
                      {v.name}
                    </RadioGroup.Label>
                    <RadioGroup.Description as="span" className="mt-1 flex items-center text-sm text-gray-500">
                      {v.description}
                    </RadioGroup.Description>
                  </span>
                </span>
                <CheckCircleIcon className={classNames(!checked ? 'invisible' : '', 'h-5 w-5 text-indigo-600')} aria-hidden="true" />
                <span
                  className={classNames(
                    active ? 'border' : 'border-2',
                    checked ? 'border-indigo-600' : 'border-transparent',
                    'pointer-events-none absolute -inset-px rounded-lg',
                  )}
                  aria-hidden="true"
                />
              </>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
}
