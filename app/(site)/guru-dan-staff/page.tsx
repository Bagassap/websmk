import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import SchoolImage from '@/components/SchoolImage';
import { getStaff } from '@/lib/data';

export const metadata: Metadata = { title: 'Guru dan Staff' };

export default async function StaffPage() {
  const staff = await getStaff();
  return (
    <>
      <PageHero title="Guru dan Staff" eyebrow="Tenaga Pendidik dan Kependidikan" crumbs={[{ label: 'Guru dan Staff' }]} />
      <section className="section"><div className="wrap teachers teachers-all" data-stagger="up">
        {staff.map((s) => (
          <figure className="teacher person" key={s.id} data-tilt>
            <span className="teacher-img"><SchoolImage src={s.photo} alt={`Foto ${s.name}`} sizes="(max-width:600px) 50vw, 280px" /></span>
            <figcaption><strong>{s.name}</strong><span>{s.role}</span></figcaption>
          </figure>
        ))}
      </div></section>
    </>
  );
}
