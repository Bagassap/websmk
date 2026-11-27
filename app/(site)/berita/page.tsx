import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import NewsCard from '@/components/NewsCard';
import PageHero from '@/components/PageHero';
import Pager from '@/components/Pager';
import { getNews, type SearchParams } from '@/lib/data';
import { pageNumber, textParam } from '@/lib/format';

export const metadata: Metadata = { title: 'Berita' };

export default async function NewsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = pageNumber(sp.halaman);
  const search = textParam(sp.q);
  const kategori = textParam(sp.kategori);
  const { posts, total, pages } = await getNews(page, search, kategori);
  const query = { ...(search ? { q: search } : {}), ...(kategori ? { kategori } : {}) };
  return (
    <>
      <PageHero title="Berita Sekolah" eyebrow="Info Terkini" crumbs={[{ label: 'Berita' }]}>
        <form className="search" action="/berita" role="search" data-reveal="up" style={{ '--d': '220ms' }}>
          <label className="sr" htmlFor="q">Cari berita</label>
          <input id="q" name="q" defaultValue={search} placeholder="Cari berita..." key={search} />
          <button className="btn btn-lime"><Search size={17} aria-hidden="true" />Cari</button>
        </form>
      </PageHero>
      <section className="section"><div className="wrap">
        {search && <p className="muted result-note">{total} hasil untuk &quot;{search}&quot;. <Link href="/berita">Tampilkan semua</Link></p>}
        {posts.length
          ? <div className="grid" data-stagger="up" key={`${page}-${search}-${kategori}`}>{posts.map((p) => <NewsCard post={p} key={p.id} />)}</div>
          : <p>Belum ada berita yang cocok.</p>}
        <Pager base="/berita" page={page} pages={pages} query={query} />
      </div></section>
    </>
  );
}
