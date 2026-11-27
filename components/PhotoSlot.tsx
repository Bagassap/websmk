import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { GraduationCap } from 'lucide-react';
import SchoolImage from './SchoolImage';

const FOTO = path.join(process.cwd(), 'storage', 'uploads', 'foto');
const EXTENSIONS = ['webp', 'jpg', 'jpeg', 'png'];

// Foto siswa dibaca dari storage/uploads/foto. Selama belum ada, tampil latar bergradasi.
// `fallback` dipakai selama belum ada file khusus bernama `name` di folder foto.
type Props = { name: string; alt?: string; sizes?: string; priority?: boolean; className?: string; fallback?: string };

export default function PhotoSlot({ name, alt = '', sizes = '100vw', priority = false, className = '', fallback }: Props) {
  const ext = EXTENSIONS.find((e) => fs.existsSync(path.join(FOTO, `${name}.${e}`)));
  const src = ext ? `/uploads/foto/${name}.${ext}` : fallback;
  return (
    <div className={`photo ${className}`}>
      {src
        ? <SchoolImage src={src} alt={alt} sizes={sizes} priority={priority} />
        : <span className="photo-empty" aria-hidden="true"><GraduationCap size={54} strokeWidth={1.2} /></span>}
    </div>
  );
}
