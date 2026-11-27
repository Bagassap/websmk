import { q } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (request.headers.get('sec-fetch-site') !== 'same-origin') return new Response(null, { status: 403 });
  const { slug } = await params;
  await q(`UPDATE contents SET views = views + 1 WHERE type='post' AND status='publish' AND slug=$1`, [slug]);
  return new Response(null, { status: 204 });
}
