'use client';

import { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { apiRequest } from '@/components/msal/requests';
import { EnvironmentContextType } from '@/components/environment/providers';

export function swrMsalTokenFetcher(
  instance: IPublicClientApplication,
  account: AccountInfo | null,
  environment: EnvironmentContextType,
  responseType: 'json' | 'text' | 'blob' = 'json',
  credentials: 'omit' | 'same-origin' | 'include' | undefined = undefined,
) {
  return (url: string): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      if (!instance) {
        console.error('no instance');
        return reject('no instance');
      }
      if (!account) {
        console.error('no account');
        return reject('no account');
      }

      try {
        const auth = await instance.acquireTokenSilent({
          account,
          scopes: apiRequest(environment).scopes,
        });
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.accessToken}`,
          },
          credentials: credentials,
        });

        // fetcher should reject on HTTP error status,
        // if not, useSWR can't detect errors.
        if (!response.ok) {
          if (responseType === 'json') {
            return reject(await response.json());
          } else {
            return reject(await response.text());
          }
        }

        // return response according to responseType
        if (responseType === 'json') {
          resolve(response.json());
        } else if (responseType === 'text') {
          resolve(response.text());
        } else if (responseType === 'blob') {
          resolve(response.blob());
        }
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  };
}
