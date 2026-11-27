import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

export type Crumb = { label: string; href?: string };

export default function PageHero({ title, eyebrow, crumbs = [], children }: { title: string; eyebrow?: string; crumbs?: Crumb[]; children?: ReactNode }) {
  return (
    <section className="page-hero">
      <span className="orb orb-a" data-parallax="-0.12" aria-hidden="true" />
      <span className="orb orb-b" data-parallax="0.1" aria-hidden="true" />
      <div className="wrap">
        {eyebrow && <p className="kicker kicker-light" data-reveal="up"><span />{eyebrow}</p>}
        <h1 data-reveal="up" style={{ '--d': '80ms' }}>{title}</h1>
        <nav className="crumbs" aria-label="Lokasi" data-reveal="up" style={{ '--d': '160ms' }}>
          <Link href="/">Beranda</Link>
          {crumbs.map((c) => <span key={c.label}><ChevronRight size={14} aria-hidden="true" />{c.href ? <Link href={c.href}>{c.label}</Link> : c.label}</span>)}
        </nav>
        {children}
      </div>
    </section>
  );
}
