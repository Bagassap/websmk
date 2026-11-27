import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

export const dynamic = 'force-dynamic';

const UPLOADS = path.join(process.cwd(), 'storage', 'uploads');
const TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', ttf: 'font/ttf', woff: 'font/woff' };

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path.map((p) => { try { return decodeURIComponent(p); } catch { return '..'; } });
  if (parts.some((p) => !p || p === '.' || p === '..' || /[\\/\0]/.test(p))) return new Response(null, { status: 404 });
  const rel = parts.join('/');
  const type = TYPES[(rel.split('.').pop() || '').toLowerCase()];
  if (!type) return new Response(null, { status: 404 });

  const file = path.resolve(UPLOADS, rel);
  if (!file.startsWith(UPLOADS + path.sep)) return new Response(null, { status: 404 });
  const stat = await fs.promises.stat(file).catch(() => null);
  if (stat?.isFile()) {
    return new Response(Readable.toWeb(fs.createReadStream(file)) as ReadableStream, {
      headers: { 'Content-Type': type, 'Content-Length': String(stat.size), 'Cache-Control': 'public, max-age=2592000', 'X-Content-Type-Options': 'nosniff' },
    });
  }
  // Sementara file belum dipindahkan, browser pengunjung diarahkan ke website lama.
  const legacy = process.env.LEGACY_MEDIA_BASE;
  if (!legacy) return new Response(null, { status: 404 });
  return new Response(null, { status: 302, headers: { Location: `${legacy.replace(/\/$/, '')}/${parts.map(encodeURIComponent).join('/')}` } });
}
