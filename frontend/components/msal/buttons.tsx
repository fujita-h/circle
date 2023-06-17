'use client';

import { InteractionStatus } from '@azure/msal-browser';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { loginRequest } from './requests';
import { useEnvironment } from '@/components/environment/providers';

export function LoginButton({ className, children }: { className?: string; children: JSX.Element }): JSX.Element {
  const environment = useEnvironment();
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  function handleLogin(loginType: 'popup' | 'redirect') {
    if (loginType === 'popup') {
      instance.loginPopup(loginRequest(environment));
    } else {
      instance.loginRedirect(loginRequest(environment));
    }
  }

  if (isAuthenticated || inProgress !== InteractionStatus.None) {
    return <></>;
  }

  return (
    <button
      className={className}
      onClick={() => {
        handleLogin('redirect');
      }}
    >
      {children}
    </button>
  );
}

export function LogoutButton({ className, children }: { className?: string; children: JSX.Element }): JSX.Element {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  function handleLogin(loginType: 'popup' | 'redirect') {
    instance
      .acquireTokenSilent({
        account: accounts[0],
        scopes: ['openid'],
      })
      .then((response) => {
        if (loginType === 'popup') {
          instance.logoutPopup({ idTokenHint: response.idToken });
        } else {
          instance.logoutRedirect({ idTokenHint: response.idToken });
        }
      });
  }

  if (!isAuthenticated || inProgress !== InteractionStatus.None) {
    return <></>;
  }

  return (
    <button
      className={className}
      onClick={() => {
        handleLogin('redirect');
      }}
    >
      {children}
    </button>
  );
}
