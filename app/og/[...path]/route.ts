import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Gambar pratinjau untuk WhatsApp, Facebook, dan media sosial lain: JPEG 1200x630.
// WhatsApp tidak selalu membaca WebP dan membatasi ukuran gambar, jadi file
// unggahan diubah ke JPEG kecil di sini.

export const dynamic = 'force-dynamic';

const UPLOADS = path.join(process.cwd(), 'storage', 'uploads');
const LOGO = path.join(process.cwd(), 'public', 'logo-smk-putih.png');
const W = 1200;
const H = 630;
const HEADERS = { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', 'X-Content-Type-Options': 'nosniff' };

async function source(parts: string[]): Promise<Buffer | null> {
  const file = path.resolve(UPLOADS, parts.join('/'));
  if (!file.startsWith(UPLOADS + path.sep)) return null;
  const local = await fs.promises.readFile(file).catch(() => null);
  if (local) return local;
  // Sementara file lama belum dipindahkan, ambil dari website lama.
  const legacy = process.env.LEGACY_MEDIA_BASE;
  if (!legacy) return null;
  try {
    const res = await fetch(`${legacy.replace(/\/$/, '')}/${parts.map(encodeURIComponent).join('/')}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok || !(res.headers.get('content-type') || '').startsWith('image/')) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Gambar cadangan: latar hijau sekolah dengan logo di tengah. */
async function fallback(): Promise<Buffer> {
  const logo = await sharp(LOGO).resize({ width: 520 }).toBuffer();
  return sharp({ create: { width: W, height: H, channels: 3, background: '#126A13' } })
    .composite([{ input: logo, gravity: 'center' }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path.map((p) => { try { return decodeURIComponent(p); } catch { return '..'; } });
  let out: Buffer | null = null;
  if (!(parts.length === 1 && parts[0] === 'default') && !parts.some((p) => !p || p === '.' || p === '..' || /[\/\0]/.test(p))) {
    const input = await source(parts);
    if (input) {
      out = await sharp(input, { limitInputPixels: 80_000_000 })
        .rotate()
        .resize(W, H, { fit: 'cover', position: 'attention' })
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 78, mozjpeg: true })
        .toBuffer()
        .catch(() => null);
    }
  }
  out ??= await fallback();
  return new Response(new Uint8Array(out), { headers: { ...HEADERS, 'Content-Length': String(out.length) } });
}
