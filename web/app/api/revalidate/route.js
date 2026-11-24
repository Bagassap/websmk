import crypto from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { CACHE_TAG } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const expected = Buffer.from(process.env.REVALIDATE_SECRET || '');
  const sent = Buffer.from(request.headers.get('x-revalidate-secret') || '');
  if (!expected.length || sent.length !== expected.length || !crypto.timingSafeEqual(sent, expected)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidateTag(CACHE_TAG, { expire: 0 });
  return Response.json({ ok: true });
}
