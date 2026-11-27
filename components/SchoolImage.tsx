import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import Image from 'next/image';

const UPLOADS = path.join(process.cwd(), 'storage', 'uploads');

function isLocal(src: string) {
  if (!src.startsWith('/uploads/')) return false;
  try {
    const file = path.resolve(UPLOADS, decodeURIComponent(src.slice('/uploads/'.length)));
    return file.startsWith(UPLOADS + path.sep) && fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

// Hanya file yang sudah ada di server yang dioptimalkan.
// Gambar lain dimuat langsung oleh browser pengunjung.
type Props = { src?: string | null; alt?: string; sizes?: string; priority?: boolean };

export default function SchoolImage({ src, alt = '', sizes = '100vw', priority = false }: Props) {
  if (!src) return null;
  if (isLocal(src)) return <Image src={encodeURI(decodeURI(src))} alt={alt} fill sizes={sizes} priority={priority} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} />;
}
