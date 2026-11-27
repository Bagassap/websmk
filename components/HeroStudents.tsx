import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import Image from 'next/image';

const FOTO = path.join(process.cwd(), 'storage', 'uploads', 'foto');
const STUDENTS = [
  { file: 'siswi-hero.webp', className: 'student-a', alt: 'Siswi SMK Ma\'arif NU 01 Limpung berseragam putih abu-abu', width: 838, height: 930 },
  { file: 'siswa-hero.webp', className: 'student-b', alt: 'Siswa SMK Ma\'arif NU 01 Limpung membawa buku dan tas', width: 807, height: 1022 },
];

export default function HeroStudents() {
  const available = STUDENTS.filter((s) => fs.existsSync(path.join(FOTO, s.file)));
  if (!available.length) return null;
  return (
    <div className="hero-students">
      <span className="students-glow" aria-hidden="true" />
      {available.map((s) => (
        <div className={`student ${s.className}`} key={s.file}>
          <Image src={`/uploads/foto/${s.file}`} alt={s.alt} width={s.width} height={s.height} sizes="(max-width:1120px) 45vw, 340px" priority />
        </div>
      ))}
    </div>
  );
}
