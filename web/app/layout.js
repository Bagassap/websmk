import Link from 'next/link';
import localFont from 'next/font/local';
import { ArrowRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import './globals.css';
import Header from '@/components/Header';
import { SocialIcon } from '@/components/Icon';
import ImageGuard from '@/components/ImageGuard';
import MotionRoot from '@/components/MotionRoot';
import { getMenu, getSite } from '@/lib/data';
import { waLink } from '@/lib/format';
import { PROGRAMS, SOCIALS } from '@/lib/school';

export const dynamic = 'force-dynamic';

const satoshi = localFont({
  src: [
    { path: './fonts/Satoshi-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Satoshi-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Satoshi-700.woff2', weight: '700', style: 'normal' },
    { path: './fonts/Satoshi-900.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
});

const BOOT = "var d=document.documentElement;d.classList.add('js');setTimeout(function(){if(!d.dataset.motion)d.classList.remove('js')},3500);";

export async function generateMetadata() {
  const site = await getSite();
  return {
    metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
    title: { default: `${site.site_name} | ${site.tagline}`, template: `%s | ${site.site_name}` },
    description: site.hero_text,
    openGraph: { siteName: site.site_name, locale: 'id_ID', type: 'website' },
    alternates: { types: { 'application/rss+xml': '/feed' } },
  };
}

export const viewport = { themeColor: '#126A13' };

export default async function RootLayout({ children }) {
  const [site, menu] = await Promise.all([getSite(), getMenu()]);
  const wa = waLink(site.whatsapp);
  const socials = SOCIALS.map((s) => (
    <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}><SocialIcon name={s.key} /></a>
  ));
  return (
    <html lang="id" className={satoshi.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: BOOT }} /></head>
      <body>
        <a className="skip" href="#isi">Langsung ke isi</a>
        <MotionRoot />
        <div className="topbar"><div className="wrap topbar-in">
          <div className="topbar-follow"><span>Ikuti Kami</span><div className="socials">{socials}</div></div>
          <div className="topbar-info">
            <span><MapPin size={15} aria-hidden="true" />{site.address}</span>
            <a href={`mailto:${site.email}`}><Mail size={15} aria-hidden="true" />{site.email}</a>
            <a href={wa} target="_blank" rel="noopener noreferrer"><Phone size={15} aria-hidden="true" />{site.whatsapp}</a>
          </div>
        </div></div>
        <Header site={site} menu={menu} />
        <main id="isi">{children}</main>
        <footer className="footer">
          <div className="footer-glow" aria-hidden="true" />
          <div className="wrap footer-grid" data-stagger="up">
            <div>
              <div className="brand brand-footer">
                <img className="brand-logo" src="/logo-smk-putih.png" alt={site.site_name} width={266} height={55} loading="lazy" />
              </div>
              <p>Membentuk generasi yang cerdas secara intelektual, kuat dalam iman, dan tangguh dalam keterampilan kerja.</p>
              <div className="socials">{socials}</div>
            </div>
            <div>
              <h3>Jelajahi</h3>
              <ul>
                {[['/tentang-kami', 'Profil Sekolah'], ['/sejarah-singkat', 'Sejarah Singkat'], ['/guru-dan-staff', 'Guru dan Staff'], ['/fasilitas', 'Fasilitas'], ['/ekstrakurikuler', 'Ekstrakurikuler'], ['/berita', 'Berita'], ['/galeri', 'Galeri']].map(([href, label]) => (
                  <li key={href}><Link href={href}><ArrowRight size={14} aria-hidden="true" />{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Program Keahlian</h3>
              <ul>{PROGRAMS.map((p) => <li key={p.slug}><Link href={`/${p.slug}`}><ArrowRight size={14} aria-hidden="true" />{p.name}</Link></li>)}</ul>
            </div>
            <div>
              <h3>Hubungi Kami</h3>
              <ul className="contact-list">
                <li><MapPin size={17} aria-hidden="true" /><span>{site.address}</span></li>
                <li><Phone size={17} aria-hidden="true" /><a href={wa} target="_blank" rel="noopener noreferrer">{site.whatsapp}</a></li>
                <li><Mail size={17} aria-hidden="true" /><a href={`mailto:${site.email}`}>{site.email}</a></li>
                <li><Clock size={17} aria-hidden="true" /><span>{site.hours}</span></li>
              </ul>
            </div>
          </div>
          <div className="wrap copyright">© {new Date().getFullYear()} {site.site_name}. Seluruh hak cipta dilindungi.</div>
        </footer>
        <ImageGuard />
      </body>
    </html>
  );
}
