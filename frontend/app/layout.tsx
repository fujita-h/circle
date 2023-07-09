import { MsalProvider } from '@/components/msal/providers';
import { EnvironmentContextType, ConfigProvider } from '@/components/environment/providers';
import { AuthenticatedAlwaysTemplate } from '@/components/msal/templates';
import './globals.css';

export const metadata = {
  title: process.env.SITE_TITLE || 'Circle',
};

const environment: EnvironmentContextType = {
  AAD_TENANT_ID: process.env.AAD_TENANT_ID || '',
  AAD_FRONTEND_CLIENT_ID: process.env.AAD_FRONTEND_CLIENT_ID || '',
  AAD_BACKEND_CLIENT_ID: process.env.AAD_BACKEND_CLIENT_ID || '',
  AAD_BACKEND_API_SCOPE_NAME: process.env.AAD_BACKEND_API_SCOPE_NAME || '',
  BACKEND_ENDPOINT: process.env.BACKEND_ENDPOINT || 'http://localhost:3001',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <ConfigProvider environment={environment}>
          <MsalProvider>
            <AuthenticatedAlwaysTemplate> {children}</AuthenticatedAlwaysTemplate>
          </MsalProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
