'use client';

import { ReactNode } from 'react';
import { useMsal, useAccount } from '@azure/msal-react';

export function LogoutButton({ className, children }: { className?: string; children: ReactNode }) {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const handleLogout = async (loginType: 'popup' | 'redirect') => {
    if (!account) return;
    try {
      const auth = await instance.acquireTokenSilent({
        account,
        scopes: ['openid'],
      });
      if (loginType === 'popup') {
        instance.logoutPopup({ idTokenHint: auth.idToken });
      } else {
        instance.logoutRedirect({ idTokenHint: auth.idToken });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <button
      className={className}
      onClick={() => {
        handleLogout('redirect');
      }}
    >
      {children}
    </button>
  );
}
