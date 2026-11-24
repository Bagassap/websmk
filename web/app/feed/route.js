import { escape as xmlEscape } from 'he';
import { getFeedRows, getSite } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = (process.env.SITE_URL || '').replace(/\/$/, '');
  const [rows, site] = await Promise.all([getFeedRows(), getSite()]);
  const items = rows.map((r) => {
    const link = xmlEscape(`${base}/berita/${r.slug}`);
    return `<item><title>${xmlEscape(r.title)}</title><link>${link}</link><guid>${link}</guid><pubDate>${new Date(r.published_at).toUTCString()}</pubDate><description>${xmlEscape(r.excerpt)}</description></item>`;
  }).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xmlEscape(site.site_name)}</title><link>${xmlEscape(base)}/</link><description>Berita sekolah</description>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
