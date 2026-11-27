import 'react';

declare module 'react' {
  // Variabel CSS seperti style={{ '--d': '120ms' }} untuk jeda animasi.
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
