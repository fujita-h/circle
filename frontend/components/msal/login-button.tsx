'use client';

import { ReactNode } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './requests';
import { useEnvironment } from '@/components/environment/providers';

export function LoginButton({ className, children }: { className?: string; children: ReactNode }) {
  const environment = useEnvironment();
  const { instance } = useMsal();

  const handleLogin = async (loginType: 'popup' | 'redirect') => {
    try {
      if (loginType === 'popup') {
        instance.loginPopup(loginRequest(environment));
      } else {
        instance.loginRedirect(loginRequest(environment));
      }
    } catch (e) {
      console.error(e);
    }
  };

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
