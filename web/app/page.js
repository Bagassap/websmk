import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowRight, BookOpen, CircleCheck, Clock, GraduationCap, Lightbulb, MessageCircle, MoonStar, Phone, Flag, Target, Trophy, Users } from 'lucide-react';
import HeroSlider from '@/components/HeroSlider';
import HeroStudents from '@/components/HeroStudents';
import Icon from '@/components/Icon';
import NewsCard from '@/components/NewsCard';
import PhotoSlot from '@/components/PhotoSlot';
import ProgramArt from '@/components/ProgramArt';
import SchoolImage from '@/components/SchoolImage';
import SectionHead from '@/components/SectionHead';
import Testimonials from '@/components/Testimonials';
import VideoButton from '@/components/VideoButton';
import { getHome, getSite, resolveLegacy } from '@/lib/data';
import { waLink } from '@/lib/format';
import { FEATURES, FOUNDED, MISSIONS, PARTNERS, TESTIMONIALS, VIDEO_ID, VISION } from '@/lib/school';

export default async function HomePage({ searchParams }) {
  const legacy = await resolveLegacy(await searchParams);
  if (legacy?.notFound) notFound();
  if (legacy?.to) permanentRedirect(legacy.to);

  const [site, { posts, programs, facilities, stats, teachers, gallery }] = await Promise.all([getSite(), getHome()]);
  const years = new Date().getFullYear() - FOUNDED;
  const wa = waLink(site.whatsapp);
  const register = <a className="btn btn-lime" href={site.spmb_url} target="_blank" rel="noopener noreferrer">Daftar Sekarang <ArrowRight size={17} aria-hidden="true" /></a>;
  const slides = [
    { eyebrow: `Selamat datang di ${site.site_name}`, title: 'Raih Masa Depan Cerah Bersama Sekolah Keren', accent: 'Masa Depan Cerah', text: site.hero_text, media: <PhotoSlot name="hero-1" sizes="100vw" priority />, actions: <>{register}<Link className="btn btn-glass" href="/tentang-kami">Profil Sekolah</Link></> },
    { eyebrow: 'Empat program keahlian', title: 'Belajar Langsung Siap Masuk Dunia Kerja', accent: 'Dunia Kerja', text: 'Ruang praktik berstandar industri dan kemitraan nasional menyiapkan lulusan yang terampil dan percaya diri.', media: <PhotoSlot name="hero-2" sizes="100vw" />, actions: <>{register}<Link className="btn btn-glass" href="/akuntansi">Lihat Program</Link></> },
    { eyebrow: site.tagline, title: 'Cerdas Ilmunya, Kuat Imannya, Tangguh Karyanya', accent: 'Kuat Imannya,', text: 'Membentuk generasi yang cerdas secara intelektual, kuat dalam iman, dan tangguh dalam keterampilan kerja.', media: <PhotoSlot name="hero-3" sizes="100vw" />, actions: <>{register}<Link className="btn btn-glass" href="/fasilitas">Lihat Fasilitas</Link></> },
  ];
  const statItems = [
    { icon: Users, value: 1500, label: 'Peserta Didik' },
    { icon: Trophy, value: years, label: 'Tahun Berkarya' },
    { icon: BookOpen, value: programs.length, label: 'Program Keahlian' },
    { icon: GraduationCap, value: stats.staff, label: 'Guru dan Staff' },
  ];

  return (
    <>
      <HeroSlider slides={slides} students={<HeroStudents />} />

      <section className="features"><div className="wrap features-grid" data-stagger="up">
        {FEATURES.map((f, i) => (
          <Link className="feature" href={f.href} key={f.title} data-tilt>
            <span className="feature-no" aria-hidden="true">0{i + 1}</span>
            <span className="feature-icon"><Icon name={f.icon} /></span>
            <strong>{f.title}</strong>
            <span>{f.text}</span>
          </Link>
        ))}
      </div></section>

      <section className="section about"><div className="wrap about-grid">
        <div className="collage">
          <div data-reveal="left"><PhotoSlot name="about-1" className="c-a" fallback="/uploads/2025/11/246.webp" alt="Upacara Hari Pahlawan di sekolah" sizes="(max-width:980px) 45vw, 260px" /></div>
          <div data-reveal="zoom" style={{ '--d': '120ms' }}><div className="ring"><PhotoSlot name="about-2" className="c-b" fallback="/uploads/2025/10/223-1.webp" alt="Upacara Hari Kesaktian Pancasila di sekolah" sizes="240px" /></div></div>
          <div className="exp" data-reveal="up" style={{ '--d': '220ms' }}><Trophy size={26} aria-hidden="true" /><span><b data-count={years}>{years}</b> Tahun <br />Melayani Pendidikan</span></div>
          <div data-reveal="right" style={{ '--d': '180ms' }}><PhotoSlot name="about-3" className="c-c" fallback="/uploads/2026/08/WhatsApp-Image-2026-08-17-at-08.18.02-3.jpeg" alt="Upacara HUT RI ke-81 di sekolah" sizes="(max-width:980px) 45vw, 300px" /></div>
        </div>
        <div>
          <p className="kicker" data-reveal="up"><span />Tentang Kami</p>
          <h2 data-reveal="up" style={{ '--d': '70ms' }}>Pendidikan yang Terjamin di <em>Sekolah Keren</em></h2>
          <p className="section-text" data-reveal="up" style={{ '--d': '140ms' }}>{site.about_text}</p>
          <div className="about-points" data-stagger="up">
            <div><span><Lightbulb size={22} aria-hidden="true" /></span><p><strong>Kreatif</strong>Mengasah gagasan dan keterampilan melalui praktik.</p></div>
            <div><span><MoonStar size={22} aria-hidden="true" /></span><p><strong>Religius</strong>Menumbuhkan akhlakul karimah dalam keseharian.</p></div>
            <div><span><Flag size={22} aria-hidden="true" /></span><p><strong>Nasionalis</strong>Menanamkan cinta tanah air dalam program sekolah.</p></div>
          </div>
          <div className="about-actions" data-reveal="up">
            <Link className="btn btn-green" href="/tentang-kami">Selengkapnya <ArrowRight size={17} aria-hidden="true" /></Link>
            <a className="call" href={wa} target="_blank" rel="noopener noreferrer"><span><Phone size={19} aria-hidden="true" /></span><small>Hubungi Kami<b>{site.whatsapp}</b></small></a>
          </div>
        </div>
      </div></section>

      <section className="campus" aria-labelledby="kampus-judul">
        <div className="campus-photo" data-reveal="zoom">
          <Image src="/uploads/foto/kampus.webp" alt={`Gedung ${site.site_name} dengan lapangan olahraga di depannya`} width={2400} height={1350} sizes="100vw" />
        </div>
        <div className="wrap campus-text">
          <p className="kicker kicker-light" data-reveal="up"><span />Kampus Kami</p>
          <h2 id="kampus-judul" data-reveal="up" style={{ '--d': '80ms' }}>Lingkungan Belajar yang <em>Luas dan Nyaman</em></h2>
          <div data-reveal="up" style={{ '--d': '160ms' }}><Link className="btn btn-lime" href="/fasilitas">Lihat Fasilitas <ArrowRight size={17} aria-hidden="true" /></Link></div>
        </div>
      </section>

      <section className="stats">
        <span className="orb orb-a" data-parallax="-0.1" aria-hidden="true" />
        <span className="orb orb-b" data-parallax="0.12" aria-hidden="true" />
        <div className="wrap stats-grid" data-stagger="zoom">
          {statItems.map(({ icon: StatIcon, value, label }) => (
            <div key={label}>
              <span className="stat-icon"><StatIcon size={30} strokeWidth={1.7} aria-hidden="true" /></span>
              <strong data-count={value}>{value.toLocaleString('id-ID')}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section"><div className="wrap">
        <SectionHead kicker="Program Keahlian" title="Pilih Jurusan untuk Masa Depanmu" accent="Masa Depanmu" text="Empat program keahlian yang menyiapkan keterampilan sesuai kebutuhan dunia kerja dan industri." />
        <div className="programs" data-stagger="up">
          {programs.map((p) => (
            <Link className="program" href={`/${p.slug}`} key={p.slug} data-tilt>
              <span className="program-img">
                <ProgramArt slug={p.slug} alt={`Siswa jurusan ${p.name}`} sizes="(max-width:600px) 100vw, (max-width:1100px) 50vw, 290px" fallback={<SchoolImage src={p.image} sizes="(max-width:600px) 100vw, (max-width:1100px) 50vw, 290px" />} />
                <b>{p.code}</b>
              </span>
              <span className="program-body">
                <span className="program-icon"><Icon name={p.icon} size={22} /></span>
                <strong>{p.name}</strong>
                <span>{p.text}</span>
                <small>{p.tracks}<ArrowRight size={16} aria-hidden="true" /></small>
              </span>
            </Link>
          ))}
        </div>
      </div></section>

      <section className="video-band">
        <div className="video-media" data-parallax="0.08"><PhotoSlot name="video" sizes="100vw" /></div>
        <div className="video-shade" />
        <div className="wrap video-in">
          <p className="kicker kicker-light" data-reveal="up"><span />Video Profil</p>
          <div className="video-row">
            <h2 data-reveal="up" style={{ '--d': '70ms' }}>Kenali Lebih Dekat <em>Sekolah Keren</em></h2>
            <div className="video-action" data-reveal="zoom" style={{ '--d': '140ms' }}><VideoButton id={VIDEO_ID} title={`Video profil ${site.site_name}`} /></div>
          </div>
        </div>
      </section>

      <section className="section tint"><div className="wrap">
        <SectionHead kicker="Tenaga Pendidik" title="Bertemu dengan Guru Kami" accent="Guru Kami" text="Pendidik dan pimpinan yang mendampingi perjalanan belajar setiap siswa." />
        <div className="teachers" data-stagger="up">
          {teachers.map((t) => (
            <figure className="teacher" key={t.id} data-tilt>
              <span className="teacher-img"><SchoolImage src={t.photo} alt={`Foto ${t.name}`} sizes="(max-width:600px) 50vw, 280px" /></span>
              <figcaption><strong>{t.name}</strong><span>{t.role}</span></figcaption>
            </figure>
          ))}
        </div>
        <div className="center-action" data-reveal="up"><Link className="btn btn-green" href="/guru-dan-staff">Lihat Semua Guru <ArrowRight size={17} aria-hidden="true" /></Link></div>
      </div></section>

      <section className="vision"><div className="wrap vision-grid">
        <div>
          <p className="kicker kicker-light" data-reveal="up"><span />Visi dan Misi</p>
          <h2 data-reveal="up" style={{ '--d': '70ms' }}>Arah Kami dalam <em>Mendidik</em> Generasi</h2>
          <div className="vision-card" data-reveal="up" style={{ '--d': '140ms' }}><Target size={26} aria-hidden="true" /><p><strong>Visi Sekolah</strong>{VISION}</p></div>
          <ul data-stagger="left">{MISSIONS.map((m) => <li key={m}><CircleCheck size={20} aria-hidden="true" />{m}</li>)}</ul>
        </div>
        <div className="vision-photo" data-reveal="right"><PhotoSlot name="visi" alt="Siswa SMK" sizes="(max-width:980px) 100vw, 540px" /></div>
      </div></section>

      {gallery.length > 0 && (
        <section className="section"><div className="wrap">
          <SectionHead kicker="Galeri" title="Momen di Sekolah Keren" accent="Sekolah Keren" text="Dokumentasi kegiatan, prestasi, dan keseharian warga sekolah." />
          <div className="home-gallery" data-stagger="zoom">
            {gallery.map((m) => (
              <Link href="/galeri" key={m.path} aria-label={m.alt || m.title}>
                <SchoolImage src={`/uploads/${m.path}`} alt={m.alt || m.title} sizes="(max-width:600px) 50vw, 400px" />
              </Link>
            ))}
          </div>
        </div></section>
      )}

      <section className="register"><div className="wrap register-card" data-reveal="zoom">
        <div className="register-photo"><PhotoSlot name="daftar" alt="Siswa baru" sizes="(max-width:980px) 100vw, 560px" /></div>
        <div className="register-body">
          <p className="kicker kicker-light"><span />Pendaftaran SPMB</p>
          <h2>Siap Bergabung Bersama <em>Sekolah Keren?</em></h2>
          <p>Hubungi admin untuk informasi pendaftaran, program keahlian, dan layanan sekolah lainnya.</p>
          <ul>
            <li><Clock size={18} aria-hidden="true" />{site.hours}</li>
            <li><Phone size={18} aria-hidden="true" />{site.whatsapp}</li>
          </ul>
          <div className="actions">
            {register}
            <a className="btn btn-glass" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} aria-hidden="true" />Chat WhatsApp</a>
          </div>
        </div>
      </div></section>

      <section className="section"><div className="wrap">
        <SectionHead kicker="Fasilitas" title="Fasilitas Lengkap dan Modern" accent="Lengkap dan Modern" text="Sarana yang menunjang belajar, praktik, olahraga, dan pembinaan karakter." />
        <div className="facilities" data-stagger="up">
          {facilities.map((f) => (
            <Link className="facility" href={`/${f.slug}`} key={f.slug}>
              <SchoolImage src={f.image} sizes="(max-width:600px) 100vw, (max-width:980px) 50vw, 390px" />
              <span className="facility-body"><strong>{f.title}</strong><span>{f.text}</span></span>
              <span className="facility-go" aria-hidden="true"><ArrowRight size={18} /></span>
            </Link>
          ))}
        </div>
      </div></section>

      <section className="testimonials">
        <span className="orb orb-a" data-parallax="-0.1" aria-hidden="true" />
        <div className="wrap">
          <SectionHead light kicker="Testimoni" title="Apa Kata Mereka?" accent="Mereka?" />
          <div data-reveal="up"><Testimonials items={TESTIMONIALS} /></div>
        </div>
      </section>

      <section className="section"><div className="wrap">
        <SectionHead kicker="Info Terkini" title="Berita dan Kegiatan Terbaru" accent="Terbaru" text="Cerita, kegiatan, dan prestasi dari SMK Ma'arif NU 01 Limpung." />
        <div className="grid" data-stagger="up">{posts.map((p) => <NewsCard post={p} key={p.id} />)}</div>
        <div className="center-action" data-reveal="up"><Link className="btn btn-green" href="/berita">Semua Berita ({stats.posts}) <ArrowRight size={17} aria-hidden="true" /></Link></div>
      </div></section>

      <section className="partners" aria-label="Mitra industri">
        <p>Dipercaya oleh berbagai industri dan organisasi nasional</p>
        <div className="marquee">
          {[0, 1].map((n) => (
            <div className="marquee-track" key={n} aria-hidden={n === 1}>
              {PARTNERS.map((p) => (
                <span className="partner" key={p.name}><span>{p.name}</span><SchoolImage src={p.src} alt={n === 0 ? p.name : ''} sizes="150px" /></span>
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
