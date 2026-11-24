import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = { title: 'Halaman tidak ditemukan' };

export default function NotFound() {
  return (
    <section className="section not-found"><div className="wrap-narrow center">
      <p className="big-404" data-reveal="zoom">404</p>
      <h1 data-reveal="up">Halaman tidak ditemukan</h1>
      <p data-reveal="up">Halaman yang Anda cari mungkin sudah dipindahkan.</p>
      <div className="actions center-row" data-reveal="up">
        <Link className="btn btn-green" href="/">Ke Beranda <ArrowRight size={17} aria-hidden="true" /></Link>
        <Link className="btn btn-soft" href="/berita">Lihat Berita</Link>
      </div>
    </div></section>
  );
}
