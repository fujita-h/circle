'use client';

import { InteractionStatus } from '@azure/msal-browser';
import {
  MsalProvider as _MsalProvider,
  AuthenticatedTemplate as _AuthenticatedTemplate,
  UnauthenticatedTemplate as _UnauthenticatedTemplate,
  useMsal,
  useIsAuthenticated,
} from '@azure/msal-react';
import { useEffect } from 'react';
import { loginRequest } from './requests';
import { useEnvironment } from '@/components/environment/providers';

export function AuthenticatedTemplate({ children }: { children: React.ReactNode }) {
  const { inProgress } = useMsal();
  if (inProgress !== InteractionStatus.None) {
    return <></>;
  }

  return (
    <>
      <_AuthenticatedTemplate>{children}</_AuthenticatedTemplate>
    </>
  );
}

export function UnauthenticatedTemplate({ children }: { children: React.ReactNode }) {
  const { inProgress } = useMsal();
  if (inProgress !== InteractionStatus.None) {
    return <></>;
  }

  return (
    <>
      <_UnauthenticatedTemplate>{children}</_UnauthenticatedTemplate>
    </>
  );
}

export function AuthenticatedAlwaysTemplate({ children }: { children: React.ReactNode }) {
  const environment = useEnvironment();
  const isAuthenticated = useIsAuthenticated();
  const { instance, inProgress } = useMsal();

  useEffect(() => {
    if (inProgress === InteractionStatus.None && !isAuthenticated) {
      instance.loginRedirect(loginRequest(environment));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inProgress, isAuthenticated]);

  if (inProgress !== InteractionStatus.None) {
    return <></>;
  }

  return (
    <>
      <_AuthenticatedTemplate>{children}</_AuthenticatedTemplate>
      <_UnauthenticatedTemplate></_UnauthenticatedTemplate>
    </>
  );
}
