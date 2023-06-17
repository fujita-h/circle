'use client';

import { useEnvironment } from '@/components/environment/providers';
import { useAccount, useMsal } from '@azure/msal-react';
import { swrMsalTokenFetcher } from '@/components/msal/fetchers';
import useSWR from 'swr';
import { useEffect, useState } from 'react';

export function UserHandle() {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [state, setState] = useState('');
  const fetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const { data, error, isLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/user`, fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!data) return;
    setState(data.handle);
  }, [data]);

  if (error || isLoading || state === '') {
    return <></>;
  }

  return <>{state}</>;
}

export function UserHandleSuspense() {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const { data } = useSWR(`${environment.BACKEND_ENDPOINT}/user`, fetcher, {
    revalidateOnFocus: false,
    suspense: true,
  });
  return <>{data.handle}</>;
}

export function UserName() {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [state, setState] = useState('');
  const fetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const { data, error, isLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/user`, fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!data) return;
    setState(data.name);
  }, [data]);

  if (error || isLoading || state === '') {
    return <></>;
  }

  return <>{state}</>;
}

export function UserNameSuspense() {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const { data } = useSWR(`${environment.BACKEND_ENDPOINT}/user`, fetcher, {
    revalidateOnFocus: false,
    suspense: true,
  });
  return <>{data.name}</>;
}

export function UserEmail() {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [state, setState] = useState('');
  const fetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const { data, error, isLoading } = useSWR(`${environment.BACKEND_ENDPOINT}/user`, fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!data) return;
    setState(data.email);
  }, [data]);

  if (error || isLoading || state === '') {
    return <></>;
  }

  return <>{state}</>;
}

export function UserEmailSuspense() {
  const environment = useEnvironment();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const fetcher = swrMsalTokenFetcher(instance, account, environment, 'json');
  const { data } = useSWR(`${environment.BACKEND_ENDPOINT}/user`, fetcher, {
    revalidateOnFocus: false,
    suspense: true,
  });
  return <>{data.email}</>;
}
