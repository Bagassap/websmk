export const dynamic = 'force-dynamic';

export function GET() {
  const base = (process.env.SITE_URL || '').replace(/\/$/, '');
  return new Response(`User-agent: *\nDisallow: /admin\nSitemap: ${base}/sitemap.xml\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
