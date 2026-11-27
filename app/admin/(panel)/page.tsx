import type { Metadata } from 'next';
import Link from 'next/link';
import AdminIcon, { type IconName } from '@/components/admin/AdminIcon';
import { STATUS_NAME, fmt, num, type Status } from '@/lib/admin';
import { requireUser } from '@/lib/auth';
import { all, one } from '@/lib/db';

export const metadata: Metadata = { title: 'Dashboard' };

type Stats = { posts: number; pages: number; media: number; staff: number; drafts: number; trash: number; gallery: number; views: number };

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, recent, months] = await Promise.all([
    one<Stats>(`SELECT
      (SELECT count(*) FROM contents WHERE type='post' AND status='publish')::int AS posts,
      (SELECT count(*) FROM contents WHERE type='page' AND status='publish')::int AS pages,
      (SELECT count(*) FROM media)::int AS media,
      (SELECT count(*) FROM staff)::int AS staff,
      (SELECT count(*) FROM contents WHERE status='draft')::int AS drafts,
      (SELECT count(*) FROM contents WHERE status='trash')::int AS trash,
      (SELECT count(*) FROM media WHERE in_gallery)::int AS gallery,
      (SELECT COALESCE(sum(views), 0)::int FROM contents WHERE type='post' AND status='publish') AS views`),
    all<{ id: number; title: string; status: Status; updated_at: Date }>(`SELECT id, title, status, updated_at FROM contents WHERE type='post' ORDER BY updated_at DESC LIMIT 6`),
    all<{ key: string; n: number }>(`SELECT to_char(m, 'YYYY-MM') AS key, count(c.id)::int AS n
      FROM generate_series(date_trunc('month', now() AT TIME ZONE 'Asia/Jakarta') - interval '6 months', date_trunc('month', now() AT TIME ZONE 'Asia/Jakarta'), interval '1 month') m
      LEFT JOIN contents c ON c.type='post' AND c.status='publish' AND date_trunc('month', c.published_at AT TIME ZONE 'Asia/Jakarta') = m
      GROUP BY m ORDER BY m`),
  ]);
  const s = stats!;

  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Jakarta' }).format(now));
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
  const today = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeZone: 'Asia/Jakarta' }).format(now);
  const name = user.name || 'Admin';
  const maxBar = Math.max(1, ...months.map((m) => m.n));
  const monthName = (k: string) => new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'UTC' }).format(new Date(`${k}-01T00:00:00Z`));
  const cards: [string, IconName, number, string, string][] = [
    ['/admin/berita', 'news', s.posts, 'Berita Tayang', 'Kelola semua berita'],
    ['/admin/halaman', 'file', s.pages, 'Halaman', 'Profil, jurusan, fasilitas'],
    ['/admin/media', 'image', s.media, 'File Media', `${num(s.gallery)} tampil di galeri`],
    ['/admin/guru', 'users', s.staff, 'Guru dan Staff', 'Data tenaga pendidik'],
  ];
  const quick: [string, IconName, string, string][] = [
    ['/admin/berita/baru', 'plus', 'Tulis Berita', 'green'],
    ['/admin/media', 'image', 'Unggah Foto', 'blue'],
    ['/admin/guru', 'users', 'Data Guru', 'bright'],
    ['/admin/pengaturan', 'settings', 'Pengaturan', 'dark'],
  ];

  return (
    <>
      <header className="dash-head">
        <div className="dash-user">
          <span className="dash-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
          <div><h1>{greeting}, {name}</h1><p>{today}</p></div>
          <Link className="head-btn" href="/admin" prefetch={false} aria-label="Muat ulang"><AdminIcon n="refresh" /></Link>
        </div>
        <div className="dash-banner">
          <Link href="/admin/berita?status=draft"><AdminIcon n="edit" /><b>{num(s.drafts)}</b><span>Draf</span></Link>
          <Link href="/admin/berita?status=trash"><AdminIcon n="trash" /><b>{num(s.trash)}</b><span>Sampah</span></Link>
          <Link href="/admin/media"><AdminIcon n="image" /><b>{num(s.gallery)}</b><span>Galeri</span></Link>
          <Link href="/admin/berita"><AdminIcon n="eye" /><b>{num(s.views)}</b><span>Dibaca</span></Link>
        </div>
      </header>

      <div className="dash-grid">
        <section className="dash-stats">
          <div className="sec-title"><h2>Statistik Website</h2><span className="live"><i />Terbaru</span></div>
          <div className="tiles">
            {cards.map(([href, icon, value, label, sub]) => (
              <Link href={href} key={href}>
                <span className="tile-top"><span className="tile-ico"><AdminIcon n={icon} /></span><span className="tile-go"><AdminIcon n="chevron" /></span></span>
                <strong>{num(value)}</strong><span className="tile-label">{label}</span><small>{sub}</small>
              </Link>
            ))}
          </div>
        </section>

        <section className="chart-card">
          <div className="chart-head"><div><h2>Berita 7 Bulan</h2><strong>{num(months.reduce((a, m) => a + m.n, 0))}</strong></div><span className="pill">Per bulan</span></div>
          <svg className="chart" viewBox="0 0 700 190" role="img" aria-label={`Jumlah berita per bulan: ${months.map((m) => `${monthName(m.key)} ${m.n}`).join(', ')}`}>
            {months.map((m, i) => {
              const h = m.n ? Math.max(8, Math.round((m.n / maxBar) * 130)) : 3;
              const x = 22 + i * 96;
              const last = i === months.length - 1;
              return (
                <g key={m.key}>
                  <rect className={last ? 'bar-now' : 'bar-old'} x={x} y={152 - h} width={60} height={h} rx={7} />
                  <text className="bar-num" x={x + 30} y={142 - h}>{m.n}</text>
                  <text className={`bar-day ${last ? 'now' : ''}`} x={x + 30} y={178}>{monthName(m.key)}</text>
                </g>
              );
            })}
          </svg>
        </section>
      </div>

      <section>
        <div className="sec-title"><h2>Menu Cepat</h2></div>
        <div className="quick">
          {quick.map(([href, icon, label, color]) => <Link className={`q-${color}`} href={href} key={label}><span><AdminIcon n={icon} /></span><b>{label}</b></Link>)}
        </div>
      </section>

      <section>
        <div className="sec-title"><h2>Terakhir Diperbarui</h2><Link className="sec-link" href="/admin/berita">Lihat semua</Link></div>
        <div className="recent">
          {recent.map((r) => (
            <Link href={`/admin/berita/${r.id}`} key={r.id}>
              <span className={`dot ${r.status}`} />
              <span className="recent-title"><b>{r.title}</b><small>{fmt(r.updated_at)}</small></span>
              <span className={`tag ${r.status}`}>{STATUS_NAME[r.status] || r.status}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
