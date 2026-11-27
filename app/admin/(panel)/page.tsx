import type { Metadata } from 'next';
import Link from 'next/link';
import AdminIcon, { type IconName } from '@/components/admin/AdminIcon';
import { STATUS_NAME, fmt, num, type Status } from '@/lib/admin';
import { requireUser } from '@/lib/auth';
import { all, one } from '@/lib/db';

export const metadata: Metadata = { title: 'Dashboard' };

// Tata letak mengikuti AdminHomeScreen aplikasi Lungo, warna mengikuti palet sekolah.

type Stats = { posts: number; pages: number; media: number; staff: number; drafts: number; trash: number; gallery: number; views: number };
type Recent = { id: number; title: string; status: Status; type: 'post' | 'page'; updated_at: Date };
type Popular = { id: number; title: string; views: number; published_at: Date };
type LogRow = { kind: 'content' | 'media'; title: string; status: Status | null; type: string | null; at: Date };

const time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
const day = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' });

function LiveBadge({ text, tone = 'green' }: { text: string; tone?: 'green' | 'amber' }) {
  return <span className={`live-badge ${tone}`}><i />{text}</span>;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, recent, months, popular, log] = await Promise.all([
    one<Stats>(`SELECT
      (SELECT count(*) FROM contents WHERE type='post' AND status='publish')::int AS posts,
      (SELECT count(*) FROM contents WHERE type='page' AND status='publish')::int AS pages,
      (SELECT count(*) FROM media)::int AS media,
      (SELECT count(*) FROM staff)::int AS staff,
      (SELECT count(*) FROM contents WHERE status='draft')::int AS drafts,
      (SELECT count(*) FROM contents WHERE status='trash')::int AS trash,
      (SELECT count(*) FROM media WHERE in_gallery)::int AS gallery,
      (SELECT COALESCE(sum(views), 0)::int FROM contents WHERE type='post' AND status='publish') AS views`),
    all<Recent>(`SELECT id, title, status, type, updated_at FROM contents ORDER BY updated_at DESC LIMIT 4`),
    all<{ key: string; n: number }>(`SELECT to_char(m, 'YYYY-MM') AS key, count(c.id)::int AS n
      FROM generate_series(date_trunc('month', now() AT TIME ZONE 'Asia/Jakarta') - interval '6 months', date_trunc('month', now() AT TIME ZONE 'Asia/Jakarta'), interval '1 month') m
      LEFT JOIN contents c ON c.type='post' AND c.status='publish' AND date_trunc('month', c.published_at AT TIME ZONE 'Asia/Jakarta') = m
      GROUP BY m ORDER BY m`),
    all<Popular>(`SELECT id, title, views, published_at FROM contents WHERE type='post' AND status='publish' ORDER BY views DESC, published_at DESC LIMIT 8`),
    all<LogRow>(`SELECT * FROM (
        (SELECT 'content' AS kind, title, status, type, updated_at AS at FROM contents ORDER BY updated_at DESC LIMIT 8)
        UNION ALL
        (SELECT 'media' AS kind, title, NULL, NULL, created_at AS at FROM media ORDER BY created_at DESC LIMIT 8)
      ) x ORDER BY at DESC LIMIT 8`),
  ]);
  const s = stats!;

  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Jakarta' }).format(now));
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';
  const today = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeZone: 'Asia/Jakarta' }).format(now);
  const name = user.name || 'Admin';

  const maxBar = Math.max(1, ...months.map((m) => m.n));
  const monthName = (k: string) => new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'UTC' }).format(new Date(`${k}-01T00:00:00Z`));
  const thisMonth = months.at(-1)?.n ?? 0;
  const lastMonth = months.at(-2)?.n ?? 0;
  const growth = lastMonth ? ((thisMonth - lastMonth) / lastMonth) * 100 : thisMonth ? 100 : 0;

  const banner: [string, IconName, number, string, boolean][] = [
    ['/admin/berita?status=draft', 'edit', s.drafts, 'Draf', s.drafts > 0],
    ['/admin/berita?status=trash', 'trash', s.trash, 'Sampah', false],
    ['/admin/media', 'image', s.gallery, 'Galeri', false],
    ['/admin/berita', 'eye', s.views, 'Dibaca', false],
  ];
  const cards: [string, IconName, number, string, string][] = [
    ['/admin/berita', 'news', s.posts, 'Berita Tayang', 'Tap kelola berita'],
    ['/admin/halaman', 'file', s.pages, 'Halaman', 'Profil, jurusan, fasilitas'],
    ['/admin/media', 'image', s.media, 'File Media', `${num(s.gallery)} tampil di galeri`],
    ['/admin/guru', 'users', s.staff, 'Guru dan Staff', 'Data tenaga pendidik'],
  ];
  const quick: [string, IconName, string, string, number][] = [
    ['/admin/berita/baru', 'plus', 'Tulis Berita', 'green', 0],
    ['/admin/berita?status=draft', 'edit', 'Draf Berita', 'orange', s.drafts],
    ['/admin/media', 'upload', 'Unggah Foto', 'purple', 0],
    ['/admin/pengaturan', 'settings', 'Pengaturan', 'dark', 0],
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
          {banner.map(([href, icon, value, label, alert]) => (
            <Link href={href} key={label} className={alert ? 'alert' : ''}><AdminIcon n={icon} /><b>{num(value)}</b><span>{label}</span></Link>
          ))}
        </div>
      </header>

      <div className="dash-grid">
        <section className="dash-stats">
          <div className="sec-title"><h2>Statistik Website</h2><span className="live"><i />Live</span></div>
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
          <div className="chart-head">
            <div><h2>Berita 7 Bulan</h2><strong>{num(months.reduce((a, m) => a + m.n, 0))} berita</strong></div>
            <span className={`growth ${growth < 0 ? 'down' : ''}`} title="Dibanding bulan lalu">
              <AdminIcon n={growth < 0 ? 'trendDown' : 'trendUp'} />{growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
            </span>
          </div>
          <svg className="chart" viewBox="0 0 700 190" role="img" aria-label={`Jumlah berita per bulan: ${months.map((m) => `${monthName(m.key)} ${m.n}`).join(', ')}`}>
            <defs>
              <linearGradient id="bar-now" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#126A13" /><stop offset="1" stopColor="#03AA12" /></linearGradient>
              <linearGradient id="bar-old" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#126A13" stopOpacity=".22" /><stop offset="1" stopColor="#126A13" stopOpacity=".42" /></linearGradient>
            </defs>
            {months.map((m, i) => {
              const h = m.n ? Math.max(8, Math.round((m.n / maxBar) * 130)) : 3;
              const x = 22 + i * 96;
              const last = i === months.length - 1;
              return (
                <g key={m.key}>
                  <title>{`${monthName(m.key)}: ${m.n} berita`}</title>
                  <path d={`M${x} 152V${152 - h + 8}a8 8 0 0 1 8-8h44a8 8 0 0 1 8 8V152z`} fill={`url(#${last ? 'bar-now' : 'bar-old'})`} />
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
          {quick.map(([href, icon, label, color, badge]) => (
            <Link className={`q-${color}`} href={href} key={label}>
              <span><AdminIcon n={icon} /></span><b>{label}</b>
              {badge > 0 && <em className="q-badge">{num(badge)} baru</em>}
            </Link>
          ))}
        </div>
      </section>

      {popular.length > 0 && (
        <section>
          <div className="sec-title">
            <h2>Berita Terpopuler <LiveBadge text={`${num(s.views)} DIBACA`} /></h2>
            <Link className="pill-link" href="/admin/berita">Lihat Semua</Link>
          </div>
          <div className="pop-row">
            {popular.map((p, i) => (
              <Link className="pop-card" href={`/admin/berita/${p.id}`} key={p.id}>
                <span className="pop-top"><span className="pop-rank">#{i + 1}</span><span className="pop-chip"><i />Tayang</span></span>
                <b>{p.title}</b>
                <small><AdminIcon n="eye" />{num(p.views)} kali <span>· {day.format(new Date(p.published_at))}</span></small>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="sec-title">
          <h2>Terakhir Diperbarui <LiveBadge text={`${num(s.drafts)} DRAF`} tone="amber" /></h2>
          <Link className="sec-link" href="/admin/berita">Lihat Semua</Link>
        </div>
        <div className="trips">
          {recent.map((r) => (
            <Link href={`/admin/${r.type === 'post' ? 'berita' : 'halaman'}/${r.id}`} key={r.id} className={`trip ${r.status}`}>
              <span className="trip-ico"><AdminIcon n={r.type === 'post' ? 'news' : 'file'} /></span>
              <span className="trip-body">
                <b>{r.title}</b>
                <small>{r.type === 'post' ? 'Berita' : 'Halaman'} · {fmt(r.updated_at)}</small>
              </span>
              <span className={`tag ${r.status}`}>{STATUS_NAME[r.status] || r.status}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="sec-title"><h2>Log Aktivitas <LiveBadge text={`${log.length} TERBARU`} tone="amber" /></h2></div>
        <div className="log">
          {log.map((e, i) => (
            <p key={i}>
              <time>{day.format(new Date(e.at))} {time.format(new Date(e.at))}</time>
              <span>{e.kind === 'media'
                ? <>Foto diunggah: {e.title || 'tanpa judul'}</>
                : <>{e.type === 'post' ? 'Berita' : 'Halaman'} {STATUS_NAME[e.status || ''] === 'Tayang' ? 'diperbarui' : `disimpan (${STATUS_NAME[e.status || ''] || e.status})`}: {e.title}</>}
              </span>
            </p>
          ))}
          {!log.length && <p><span>Belum ada aktivitas.</span></p>}
        </div>
      </section>
    </>
  );
}
