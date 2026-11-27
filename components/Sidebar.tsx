import Link from 'next/link';
import { CircleArrowRight, Search } from 'lucide-react';
import SchoolImage from './SchoolImage';
import { getLatestPosts } from '@/lib/data';
import { fmtDate } from '@/lib/format';
import { PROGRAMS } from '@/lib/school';

export default async function Sidebar({ currentPost, currentPage }: { currentPost?: string; currentPage?: string }) {
  const latest = (await getLatestPosts()).filter((p) => p.slug !== currentPost).slice(0, 4);
  return (
    <aside className="sidebar" aria-label="Informasi tambahan">
      <form className="side-search" action="/berita" method="get" role="search" data-reveal="right">
        <input type="search" name="q" placeholder="Cari berita..." aria-label="Cari berita" maxLength={100} required />
        <button type="submit" aria-label="Cari"><Search size={18} aria-hidden="true" /></button>
      </form>

      <section className="side-card side-programs" data-reveal="right" style={{ '--d': '90ms' }}>
        <h2>Program Keahlian</h2>
        <ul>
          {PROGRAMS.map((p) => (
            <li key={p.slug}>
              <Link href={`/${p.slug}`} aria-current={p.slug === currentPage ? 'page' : undefined}>
                <CircleArrowRight size={19} aria-hidden="true" />{p.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {latest.length > 0 && (
        <section className="side-card side-latest" data-reveal="right" style={{ '--d': '180ms' }}>
          <h2>Postingan Terakhir</h2>
          <ul>
            {latest.map((p) => (
              <li key={p.id}>
                <Link href={`/berita/${p.slug}`}>
                  <span className="side-thumb">{p.image && <SchoolImage src={`/uploads/${p.image}`} sizes="84px" />}</span>
                  <span className="side-post"><strong>{p.title}</strong><small>{fmtDate(p.published_at)}</small></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
