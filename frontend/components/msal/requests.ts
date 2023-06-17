import { EnvironmentContextType } from '@/components/environment/providers';

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest = (env: EnvironmentContextType) => {
  return {
    scopes: ['openid', 'offline_access', 'User.Read', `api://${env.AAD_BACKEND_CLIENT_ID}/${env.AAD_BACKEND_API_SCOPE_NAME}`],
  };
};

export const apiRequest = (env: EnvironmentContextType) => {
  return {
    // Do NOT add Graph API scopes here. Only add scopes that are defined by this API.
    scopes: [`api://${env.AAD_BACKEND_CLIENT_ID}/${env.AAD_BACKEND_API_SCOPE_NAME}`],
  };
};
