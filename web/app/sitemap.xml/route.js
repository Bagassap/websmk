import { escape as xmlEscape } from 'he';
import { getSitemapRows } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = (process.env.SITE_URL || '').replace(/\/$/, '');
  const rows = await getSitemapRows();
  const entry = (u, d) => `<url><loc>${xmlEscape(base + u)}</loc>${d ? `<lastmod>${new Date(d).toISOString()}</lastmod>` : ''}</url>`;
  const body = ['/', '/berita', '/galeri'].map((u) => entry(u))
    .concat(rows.map((r) => entry(r.type === 'post' ? `/berita/${r.slug}` : `/${r.slug}`, r.updated_at))).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
