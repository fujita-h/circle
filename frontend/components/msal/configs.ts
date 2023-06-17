import { Configuration, ProtocolMode } from '@azure/msal-browser';
import { EnvironmentContextType } from '../environment/providers';

export const aadConfig = (env: EnvironmentContextType): Configuration => {
  return {
    auth: {
      protocolMode: ProtocolMode.AAD,
      clientId: env.AAD_FRONTEND_CLIENT_ID || '',
      authority: `https://login.microsoftonline.com/${env.AAD_TENANT_ID}`,
      redirectUri: '/',
      postLogoutRedirectUri: '/',
      navigateToLoginRequestUrl: true,
    },
    cache: {
      cacheLocation: 'sessionStorage', // This configures where your cache will be stored
      storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
  };
};
