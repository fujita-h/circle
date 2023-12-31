'use client';

import { MsalProvider as _MsalProvider } from '@azure/msal-react';
import { AuthenticationResult, EventMessage, EventType, PublicClientApplication } from '@azure/msal-browser';
import { aadConfig } from './configs';
import { useEnvironment } from '@/components/environment/providers';

export function MsalProvider({ children }: { children: React.ReactNode }) {
  const environment = useEnvironment();
  const msalInstance = new PublicClientApplication(aadConfig(environment));

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  msalInstance.addEventCallback((message: EventMessage) => {
    if (message.eventType === EventType.LOGIN_SUCCESS) {
      const payload = message.payload as AuthenticationResult;
      if (payload) {
        const account = payload.account;
        msalInstance.setActiveAccount(account);
      }
    }
  });

  return (
    <>
      <_MsalProvider instance={msalInstance}>{children}</_MsalProvider>
    </>
  );
}
