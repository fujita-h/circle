'use client';

import { useEnvironment } from '@/components/environment/providers';
import { apiRequest } from '@/components/msal/requests';
import { useAccount, useMsal } from '@azure/msal-react';
import { ChangeEvent, useState } from 'react';
import { BackendImage } from '@/components/backend-image';
import { PhotoIcon } from '@heroicons/react/24/outline';

export function UpdatePhotoForm({ groupId }: { groupId: string }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const handleSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!account) return;
    const files = e.target.files;
    if (files === null) return;
    if (files.length === 0) return;
    const file = files[0];

    try {
      const formData = new FormData();
      formData.append('file', file);

      const auth = await instance.acquireTokenSilent({
        account,
        scopes: apiRequest(environment).scopes,
      });
      const response = await fetch(`${environment.BACKEND_ENDPOINT}/groups/${groupId}/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: formData,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="md:col-span-2">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
          <div className="col-span-full flex items-center gap-x-8">
            <BackendImage
              src={`/groups/${groupId}/photo`}
              className="h-24 w-24 flex-none rounded-lg bg-gray-800 object-cover"
              alt="user-icon"
              fallback={<PhotoIcon className="h-24 w-24 text-gray-300" />}
            />
            <div>
              <button
                type="button"
                className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-slate-400/40 focus-visible:outline-indigo-500 hover:bg-slate-100/80"
                onClick={() => {
                  const target = document.querySelector('input[type=file]#photo_upload');
                  if (target) {
                    (target as HTMLInputElement).click();
                  }
                }}
              >
                <input
                  id="photo_upload"
                  type="file"
                  accept="image/jpeg,image/gif,image/png"
                  multiple={false}
                  className="sr-only hidden"
                  tabIndex={-1}
                  onChange={handleSelected}
                />
                Change Photo
              </button>
              <p className="mt-2 text-xs leading-5 text-gray-400">JPG, GIF or PNG. 128KB max.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
