'use client';

import { useEnvironment } from '@/components/environment/providers';
import { apiRequest } from '@/components/msal/requests';
import { useAccount, useMsal } from '@azure/msal-react';
import clsx from 'clsx';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './styles.module.css';

export function DnDTextarea({ body, setBody }: { body: string; setBody: (body: string) => void }) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [selectionPosition, setSelectionPosition] = useState(0);

  const uploadFile = async (file: File) => {
    return new Promise(async (resolve, reject) => {
      if (!account) return reject();
      try {
        const formData = new FormData();
        formData.append('file', file);

        const auth = await instance.acquireTokenSilent({
          account,
          scopes: apiRequest(environment).scopes,
        });
        const response = await fetch(`${environment.BACKEND_ENDPOINT}/files`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
          body: formData,
        });
        if (response.ok) {
          resolve(response.json());
        } else {
          reject();
        }
      } catch (e) {
        reject();
      }
    });
  };

  const uploadFiles = async (files: File[]) => {
    return Promise.allSettled(files.map((file) => uploadFile(file)));
  };

  const insertFileText = (results: any[]) => {
    return results
      .map((result: any) => {
        if (result.status === 'fulfilled') {
          return `![image](${environment.BACKEND_ENDPOINT}/files/${result.value.id})`;
        } else {
          return '';
        }
      })
      .join('\n');
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const results = await uploadFiles(acceptedFiles);
    const doc = insertFileText(results);
    if (doc.length === 0) return;
    setBody(body.substring(0, selectionPosition) + doc + body.substring(selectionPosition));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      className="w-full h-full"
      {...getRootProps({
        onClick: (e) => {
          e.stopPropagation();
        },
      })}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <div className="flex justify-center items-center bg-white w-full h-full rounded-md border-0 p-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300">
          <div>Drop the files here ...</div>
        </div>
      ) : (
        <textarea
          className={clsx(
            styles.thinScrollbar,
            'resize-none block w-full h-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-400 sm:text-sm sm:leading-6',
          )}
          placeholder="Write something..."
          value={body}
          onKeyUp={(e) => {
            setSelectionPosition(e.currentTarget.selectionStart);
          }}
          onClick={(e) => {
            setSelectionPosition(e.currentTarget.selectionStart);
          }}
          onChange={(e) => {
            setBody(e.target.value);
            setSelectionPosition(e.currentTarget.selectionStart);
          }}
          onPaste={async (e) => {
            // Get the data of clipboard
            const clipboardItems = e.clipboardData.items;
            const items = [].slice.call(clipboardItems).filter(function (item: any) {
              // Filter the image items only
              return item.type.indexOf('image') !== -1;
            });
            if (items.length === 0) {
              return;
            }
            // upload files
            const results = await uploadFiles(items.map((item: any) => item.getAsFile()));
            const doc = insertFileText(results);

            if (doc.length === 0) return;

            setBody(body.substring(0, selectionPosition) + doc + body.substring(selectionPosition));
          }}
        />
      )}
    </div>
  );
}
