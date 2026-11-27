import type { Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';

const satoshi = localFont({
  src: [
    { path: './fonts/Satoshi-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Satoshi-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Satoshi-700.woff2', weight: '700', style: 'normal' },
    { path: './fonts/Satoshi-900.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
});

export const viewport: Viewport = { themeColor: '#126A13', viewportFit: 'cover' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={satoshi.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
