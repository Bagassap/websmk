import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Halaman tidak ditemukan' };

export default function NotFound() {
  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 16, fontFamily: 'var(--font-satoshi), sans-serif', textAlign: 'center' }}>
      <div>
        <h1>Halaman tidak ditemukan</h1>
        <p><a href="/">Ke Beranda</a></p>
      </div>
    </main>
  );
}
