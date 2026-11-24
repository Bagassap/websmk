import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(here, '..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const adminUrl = `http://127.0.0.1:${process.env.ADMIN_PORT || 3001}`;
const legacy = process.env.LEGACY_MEDIA_BASE ? new URL(process.env.LEGACY_MEDIA_BASE).origin : '';
const dev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data:${legacy ? ` ${legacy}` : ''}`,
  "font-src 'self'",
  `connect-src 'self'${dev ? ' ws:' : ''}`,
  'frame-src https://www.youtube-nocookie.com https://www.youtube.com https://www.google.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

export default {
  poweredByHeader: false,
  outputFileTracingRoot: here,
  turbopack: { root: here },
  images: {
    localPatterns: [{ pathname: '/uploads/**' }],
    qualities: [75],
    formats: ['image/webp'],
    minimumCacheTTL: 2592000,
  },
  async redirects() {
    return [{ source: '/organisasi', destination: '/ekstrakurikuler', permanent: true }];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/admin', destination: `${adminUrl}/admin` },
        { source: '/admin/:path*', destination: `${adminUrl}/admin/:path*` },
        { source: '/css/admin.css', destination: `${adminUrl}/css/admin.css` },
        { source: '/js/admin.js', destination: `${adminUrl}/js/admin.js` },
      ],
    };
  },
  async headers() {
    return [{
      source: '/((?!admin|css/admin|js/admin).*)',
      headers: [
        { key: 'Content-Security-Policy', value: csp },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      ],
    }];
  },
};
