import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import { Cog } from 'lucide-react';

const FOTO = path.join(process.cwd(), '..', 'storage', 'uploads', 'foto');
const THEMES = {
  akuntansi: { file: 'akl-hero.webp', width: 1458, height: 801, mark: 'Rp', chips: ['Debit = Kredit', 'Rp 1.250.000', 'Neraca Seimbang', 'Laba +12%'] },
  pemasaran: { file: 'pm-hero.webp', width: 1500, height: 922, mark: '%', chips: ['Diskon 20%', 'Total Rp 45.000', 'Promo Hari Ini', 'Stok Tersedia'] },
  'teknik-otomotif': { file: 'to-hero.webp', width: 1365, height: 972, mark: <Cog strokeWidth={1.4} />, chips: ['Tune Up', 'CVT', 'Injeksi', 'Servis'] },
  pplg: {
    file: 'pplg-hero.webp',
    width: 1500,
    height: 832,
    mark: '</>',
    chips: ['const sekolah = "keren";', 'print("Halo, PPLG!")', '<Game level={1} />', 'git commit -m "siap"', '{ }', '01101'],
  },
};
const SLOTS = ['a', 'b', 'c', 'd', 'e', 'f'];

// Foto siswa tiap jurusan dengan latar sesuai bidangnya. `fallback` tampil jika filenya belum ada.
export default function ProgramArt({ slug, alt, sizes, priority = false, fallback = null }) {
  const theme = THEMES[slug];
  if (!theme || !fs.existsSync(path.join(FOTO, theme.file))) return fallback;
  return (
    <span className={`program-art art-${slug}`}>
      <span className="art-grid" aria-hidden="true" />
      <span className="art-glow" aria-hidden="true" />
      <span className="art-mark" aria-hidden="true">{theme.mark}</span>
      {theme.chips.map((chip, i) => <code className={`art-code art-${SLOTS[i]}`} key={chip} aria-hidden="true">{chip}</code>)}
      <Image className="art-photo" src={`/uploads/foto/${theme.file}`} alt={alt} width={theme.width} height={theme.height} sizes={sizes} priority={priority} />
    </span>
  );
}
