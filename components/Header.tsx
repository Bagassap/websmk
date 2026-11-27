'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, Menu, Search, X } from 'lucide-react';
import type { MenuItem, MenuNode, Site } from '@/lib/data';

const external = (url: string) => /^https?:\/\//.test(url || '');

function MenuLink({ item, current }: { item: MenuItem; current: string }) {
  const url = item.url || '#';
  if (external(url)) return <a href={url} target="_blank" rel="noopener noreferrer">{item.title}</a>;
  return <Link href={url} aria-current={url === current ? 'page' : undefined}>{item.title}</Link>;
}

export default function Header({ site, menu }: { site: Site; menu: MenuNode[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOpen(false);
    setSub(null);
    setSearching(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    const onClick = (e: MouseEvent) => { if (!(e.target as Element | null)?.closest?.('.has-sub')) setSub(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSub(null); setOpen(false); setSearching(false); } };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => { if (searching) input.current?.focus(); }, [searching]);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = input.current?.value.trim();
    if (q) router.push(`/berita?q=${encodeURIComponent(q)}`);
    setSearching(false);
  };

  return (
    <header className={`header${scrolled ? ' scrolled' : ''}`}>
      <div className="wrap header-in">
        <Link className="brand" href="/" aria-label={`${site.site_name}, ke beranda`}>
          <img className="brand-logo" src="/logo-smk.png" alt={site.site_name} width={843} height={174} />
        </Link>
        <nav id="nav" className={`nav${open ? ' open' : ''}`} aria-label="Menu utama">
          <ul>
            {menu.map((m) => (
              <li key={m.id} className={`${m.children.length ? 'has-sub' : ''}${sub === m.id ? ' open' : ''}`}>
                {m.children.length ? (
                  <>
                    <button type="button" className="sub-btn" aria-expanded={sub === m.id} onClick={() => setSub(sub === m.id ? null : m.id)}>
                      {m.title}<ChevronDown size={15} aria-hidden="true" />
                    </button>
                    <ul className="sub">
                      {m.children.map((c) => <li key={c.id}><MenuLink item={c} current={pathname} /></li>)}
                    </ul>
                  </>
                ) : <MenuLink item={m} current={pathname} />}
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-tools">
          <button className="icon-btn" type="button" aria-label="Cari berita" aria-expanded={searching} onClick={() => setSearching(!searching)}><Search size={19} /></button>
          <a className="btn btn-lime header-cta" href={site.spmb_url} target="_blank" rel="noopener noreferrer">Daftar SPMB <ArrowRight size={16} aria-hidden="true" /></a>
          <button className="icon-btn nav-toggle" type="button" aria-label={open ? 'Tutup menu' : 'Buka menu'} aria-expanded={open} aria-controls="nav" onClick={() => setOpen(!open)}>
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      <form className={`search-drop${searching ? ' open' : ''}`} onSubmit={submit} role="search" inert={!searching}>
        <div className="wrap">
          <label className="sr" htmlFor="header-search">Cari berita</label>
          <input id="header-search" ref={input} placeholder="Cari berita sekolah..." />
          <button className="btn btn-green">Cari</button>
        </div>
      </form>
    </header>
  );
}
