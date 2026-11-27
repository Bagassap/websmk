import type { NextConfig } from 'next';

const legacy = process.env.LEGACY_MEDIA_BASE ? new URL(process.env.LEGACY_MEDIA_BASE).origin : '';
const dev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${legacy ? ` ${legacy}` : ''}`,
  "font-src 'self'",
  `connect-src 'self'${dev ? ' ws:' : ''}`,
  'frame-src https://www.youtube-nocookie.com https://www.youtube.com https://www.google.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

const config: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  images: {
    localPatterns: [{ pathname: '/uploads/**' }],
    qualities: [75],
    formats: ['image/webp'],
    minimumCacheTTL: 2592000,
  },
  // Isi berita dan unggahan gambar dari panel admin bisa lebih dari 1 MB.
  experimental: { serverActions: { bodySizeLimit: '20mb' } },
  async redirects() {
    return [{ source: '/organisasi', destination: '/ekstrakurikuler', permanent: true }];
  },
  async headers() {
    const base = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    ];
    return [
      { source: '/:path*', headers: base },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }, { key: 'Cache-Control', value: 'no-store' }] },
      { source: '/admin', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }, { key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

export default config;
