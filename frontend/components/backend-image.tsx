'use client';

import { ReactNode, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';

/**
 * Get image from backend with token, then render it as <img> with embedded token.
 * @param src - Relative image URL from backend endpoint.
 * @returns <img> element
 */
export function BackendImage({
  src,
  className = '',
  alt = '',
  loading = <></>,
  fallback = <></>,
}: {
  src: string;
  className?: string;
  alt?: string;
  loading?: ReactNode;
  fallback?: ReactNode;
}) {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [embd, setEmbd] = useState('');

  const fetcher = swrMsalTokenFetcher(instance, account, environment, 'blob');
  const { data, error, isLoading } = useSWR(`${environment.BACKEND_ENDPOINT}${src}`, fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 0,
  });

  useEffect(() => {
    if (!data) return;
    blobToBase64(data).then((b64) => {
      setEmbd(b64);
    });
  }, [data]);

  if (error) {
    return <>{fallback}</>;
  }

  if (isLoading || embd === '') {
    return <>{loading}</>;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={embd} className={className} alt={alt} />;
}

const blobToBase64 = (blob: Blob): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
