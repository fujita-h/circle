'use client';

import React, { createContext, useContext } from 'react';

export type EnvironmentContextType = {
  AAD_TENANT_ID: string;
  AAD_FRONTEND_CLIENT_ID: string;
  AAD_BACKEND_CLIENT_ID: string;
  AAD_BACKEND_API_SCOPE_NAME: string;
  BACKEND_ENDPOINT: string;
  WEBSITE_NAME: string;
};

export let EnvironmentContext: React.Context<EnvironmentContextType>;

export function ConfigProvider({ environment, children }: { environment: EnvironmentContextType; children: React.ReactNode }) {
  EnvironmentContext = createContext<EnvironmentContextType>(environment);
  return (
    <>
      <EnvironmentContext.Provider value={environment}>{children}</EnvironmentContext.Provider>
    </>
  );
}

export const useEnvironment = () => {
  return useContext(EnvironmentContext);
};
