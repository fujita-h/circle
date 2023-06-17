/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['app', 'components', 'pages', 'utils', 'libs'],
  },
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'same-origin',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: `default-src 'self'; img-src 'self' ${process.env.BACKEND_ENDPOINT}  https://tailwindui.com data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' localhost:* https://login.microsoftonline.com `,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000;',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
