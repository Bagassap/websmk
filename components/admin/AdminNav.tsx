'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/admin/actions';
import AdminIcon, { type IconName } from './AdminIcon';

const LINKS: [string, string, IconName][] = [
  ['/admin', 'Dashboard', 'home'], ['/admin/berita', 'Berita', 'news'], ['/admin/berita/baru', 'Tulis Berita', 'plus'], ['/admin/halaman', 'Halaman', 'file'],
  ['/admin/media', 'Media', 'image'], ['/admin/guru', 'Guru & Staff', 'users'], ['/admin/pengaturan', 'Pengaturan', 'settings'],
  ['/admin/password', 'Password', 'lock'],
];
const BOTTOM = ['/admin', '/admin/berita', '/admin/berita/baru', '/admin/media', '/admin/guru'];
const SHORT: Record<string, string> = { '/admin/guru': 'Guru', '/admin/berita/baru': 'Tulis' };
const MORE = ['/admin/halaman', '/admin/pengaturan', '/admin/password'];

function LogoutButton({ withSpan }: { withSpan?: boolean }) {
  return (
    <form action={logout}>
      <button><AdminIcon n="logout" />{withSpan ? <span>Keluar</span> : 'Keluar'}</button>
    </form>
  );
}

export default function AdminNav() {
  const path = usePathname();
  // Menu yang aktif adalah alamat terpanjang yang cocok, agar "Tulis Berita" tidak ikut menyalakan "Berita".
  const active = LINKS.map(([u]) => u).filter((u) => path === u || (u !== '/admin' && path.startsWith(`${u}/`))).sort((a, b) => b.length - a.length)[0];
  const isOn = (u: string) => u === active;
  const current = (u: string) => (isOn(u) ? { className: 'on', 'aria-current': 'page' as const } : {});
  return (
    <>
      <aside className="side">
        <Link className="logo" href="/admin"><img src="/logo-smk-putih.png" alt="SMK Ma'arif NU 01 Limpung" width={266} height={55} /></Link>
        <p className="side-label">Menu Admin</p>
        <nav aria-label="Menu admin">
          {LINKS.map(([u, l, i]) => <Link key={u} href={u} {...current(u)}><AdminIcon n={i} /><span>{l}</span></Link>)}
        </nav>
        <div className="side-foot">
          <a href="/" target="_blank" rel="noopener"><AdminIcon n="globe" /><span>Lihat website</span></a>
          <LogoutButton withSpan />
        </div>
      </aside>
      <nav className="bottom" aria-label="Menu admin">
        {LINKS.filter(([u]) => BOTTOM.includes(u)).map(([u, l, i]) => (
          <Link key={u} href={u} {...current(u)} {...(u === '/admin/berita/baru' ? { className: `write${isOn(u) ? ' on' : ''}` } : {})}><AdminIcon n={i} /><span>{SHORT[u] || l}</span></Link>
        ))}
        <details className="more" key={path}>
          <summary className={MORE.some(isOn) ? 'on' : ''}><AdminIcon n="menu" /><span>Lainnya</span></summary>
          <div>
            <Link href="/admin/halaman"><AdminIcon n="file" />Halaman</Link>
            <Link href="/admin/pengaturan"><AdminIcon n="settings" />Pengaturan</Link>
            <Link href="/admin/password"><AdminIcon n="lock" />Password</Link>
            <a href="/" target="_blank" rel="noopener"><AdminIcon n="globe" />Lihat website</a>
            <LogoutButton />
          </div>
        </details>
      </nav>
    </>
  );
}
