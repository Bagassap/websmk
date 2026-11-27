import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Bike, CircleCheck, Clock, Drum, Eye, Goal, HeartPulse, History, Mail, MapPin, MessageCircle, Mic, Newspaper, ShieldCheck, Sparkles, Swords, Target, Tent, Trophy, Users, Volleyball } from 'lucide-react';
import SchoolImage from './SchoolImage';
import Testimonials from './Testimonials';
import VideoButton from './VideoButton';
import type { ActivitiesData, ContactData, HistoryData, ProfileData } from '@/lib/about';
import type { Site } from '@/lib/data';
import { waLink } from '@/lib/format';
import type { Partner } from '@/lib/program';
import { TESTIMONIALS } from '@/lib/school';

function Partners({ items }: { items: Partner[] }) {
  if (!items.length) return null;
  return (
    <section className="pd-section">
      <p className="kicker" data-reveal="up"><span />Kerja Sama</p>
      <h2 data-reveal="up">Mitra Industri dan Organisasi</h2>
      <div className="pd-partners" data-stagger="up">
        {items.map((p) => <div key={p.src}><span aria-hidden="true">{p.name}</span><SchoolImage src={p.src} alt={`Logo ${p.name}`} sizes="140px" /></div>)}
      </div>
    </section>
  );
}

export function ProfilePage({ data }: { data: ProfileData }) {
  const { texts, leader, photos, vision, missions, partners, people } = data;
  return (
    <article className="article program-detail">
      <section className="ab-head">
        <div>
          <p className="kicker" data-reveal="up"><span />Tentang Kami</p>
          <h2 data-reveal="up">Pendidikan yang Terjamin Bersama Sekolah Keren</h2>
          {texts.map((t) => <p className="pd-intro" data-reveal="up" key={t} dangerouslySetInnerHTML={{ __html: t }} />)}
        </div>
        <figure className="ab-leader" data-reveal="right">
          <span><SchoolImage src={leader.photo} alt={`Foto ${leader.name}`} sizes="260px" priority /></span>
          <figcaption><strong>{leader.name}</strong>{leader.role}</figcaption>
        </figure>
      </section>

      {photos.length > 0 && (
        <div className="ab-photos" data-stagger="zoom">
          {photos.map((src) => <span key={src}><SchoolImage src={src} alt="Lingkungan sekolah" sizes="(max-width:640px) 100vw, 420px" /></span>)}
        </div>
      )}

      <section className="ab-vm">
        <div data-reveal="left">
          <span className="ab-icon"><Eye size={24} aria-hidden="true" /></span>
          <h2>Visi Sekolah</h2>
          <p>{vision}</p>
        </div>
        <div data-reveal="right">
          <span className="ab-icon"><Target size={24} aria-hidden="true" /></span>
          <h2>Misi Sekolah</h2>
          <ul>{missions.map((m) => <li key={m}><CircleCheck size={19} aria-hidden="true" />{m}</li>)}</ul>
        </div>
      </section>

      <section className="pd-section">
        <p className="kicker" data-reveal="up"><span />Kepemimpinan</p>
        <h2 data-reveal="up">Struktur Organisasi</h2>
        <div className="ab-people" data-stagger="up">
          {people.map((p) => (
            <figure key={`${p.name}-${p.role}`}>
              <span><SchoolImage src={p.photo} alt={`Foto ${p.name}`} sizes="(max-width:640px) 50vw, 270px" /></span>
              <figcaption><strong>{p.name}</strong>{p.role}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <Partners items={partners} />

      <section className="ab-links" data-stagger="up">
        <Link href="/sejarah-singkat"><History size={24} aria-hidden="true" /><span><strong>Sejarah Singkat</strong>Kenali perjalanan berdirinya sekolah</span><ArrowRight size={19} aria-hidden="true" /></Link>
        <Link href="/contact-us"><MessageCircle size={24} aria-hidden="true" /><span><strong>Hubungi Kami</strong>Tertarik bergabung bersama kami?</span><ArrowRight size={19} aria-hidden="true" /></Link>
      </section>
    </article>
  );
}

export function HistoryPage({ data }: { data: HistoryData }) {
  const { image, before, after, video, partners, milestones } = data;
  return (
    <article className="article program-detail">
      <figure className="pd-figure" data-reveal="zoom">
        <SchoolImage src={image} alt="Sejarah sekolah" sizes="(max-width:1024px) 100vw, 860px" priority />
        <figcaption><b>2003</b>Awal berdirinya sekolah</figcaption>
      </figure>

      <section className="pd-section">
        <p className="kicker" data-reveal="up"><span />Sejarah Singkat</p>
        <h2 data-reveal="up">Awal Mula Sekolah Kami</h2>
        <div className="ab-text">{before.map((t) => <p className="pd-intro" data-reveal="up" key={t} dangerouslySetInnerHTML={{ __html: t }} />)}</div>
      </section>

      {milestones.length > 0 && (
        <ol className="ab-time" data-stagger="up">
          {milestones.map((m) => <li key={m.date}><b>{m.date}</b>{m.text}</li>)}
        </ol>
      )}

      <section className="pd-section">
        <p className="kicker" data-reveal="up"><span />Perjalanan</p>
        <h2 data-reveal="up">Pendirian dan Perkembangan</h2>
        <div className="ab-text">{after.map((t) => <p className="pd-intro" data-reveal="up" key={t} dangerouslySetInnerHTML={{ __html: t }} />)}</div>
      </section>

      {video && (
        <section className="pd-video" data-reveal="up">
          <SchoolImage src={image} sizes="(max-width:1024px) 100vw, 860px" />
          <div><p className="kicker kicker-light"><span />Video Profil</p><h2>Lihat Suasana Sekolah Kami</h2></div>
          <VideoButton id={video} title="Video profil sekolah" />
        </section>
      )}

      <Partners items={partners} />
    </article>
  );
}

const ACTIVITY_ICONS: [RegExp, LucideIcon][] = [
  [/IPNU/i, Users], [/Pramuka/i, Tent], [/Palang Merah/i, HeartPulse], [/Patroli/i, ShieldCheck], [/Pers/i, Newspaper],
  [/PIK-R/i, MessageCircle], [/Safety/i, Bike], [/Pagar Nusa|Karate/i, Swords], [/Rebana/i, Drum], [/Tari/i, Sparkles],
  [/Paduan/i, Mic], [/Sepak Bola|Futsal/i, Goal], [/Voli|Takraw/i, Volleyball],
];
const activityIcon = (title: string): LucideIcon => ACTIVITY_ICONS.find(([test]) => test.test(title))?.[1] ?? Trophy;

export function ActivitiesPage({ data }: { data: ActivitiesData }) {
  const { heading, intro, total, groups } = data;
  return (
    <article className="article program-detail">
      <section className="pd-section">
        <p className="kicker" data-reveal="up"><span />Kegiatan Siswa</p>
        <h2 data-reveal="up">{heading}</h2>
        {intro && <p className="pd-intro" data-reveal="up" dangerouslySetInnerHTML={{ __html: intro }} />}
        <nav className="ex-nav" aria-label="Bidang ekstrakurikuler" data-stagger="up">
          <span><b>{total}</b> Kegiatan</span>
          {groups.map((g) => <a href={`#${g.id}`} key={g.id}>{g.title} <small>{g.items.length}</small></a>)}
        </nav>
      </section>

      {groups.map((g) => (
        <section className="pd-section ex-group" id={g.id} key={g.id}>
          <h2 data-reveal="up">{g.title}</h2>
          <div className="ex-grid" data-stagger="up">
            {g.items.map((item) => {
              const ItemIcon = activityIcon(item.title);
              return (
                <div className="pd-card ex-card" key={item.title}>
                  <span className="ex-icon"><ItemIcon size={23} aria-hidden="true" /></span>
                  <h3>{item.title}</h3>
                  <p dangerouslySetInnerHTML={{ __html: item.text }} />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </article>
  );
}

export function ContactPage({ data, site }: { data: ContactData; site: Site }) {
  const { intro, hoursNote, hours, emails } = data;
  const place = `${site.site_name}, ${site.address}`;
  return (
    <article className="article program-detail">
      <section className="pd-section">
        <p className="kicker" data-reveal="up"><span />Kami Siap Melayani</p>
        <h2 data-reveal="up">Hubungi {site.site_name}</h2>
        {intro && <p className="pd-intro" data-reveal="up" dangerouslySetInnerHTML={{ __html: intro }} />}
        <div className="ab-contact" data-stagger="up">
          <a href={waLink(site.whatsapp)} target="_blank" rel="noopener noreferrer"><MessageCircle size={24} aria-hidden="true" /><span><strong>WhatsApp</strong>{site.whatsapp}</span></a>
          <div><Clock size={24} aria-hidden="true" /><span><strong>Senin - Jumat</strong>{hours}</span></div>
          <div><MapPin size={24} aria-hidden="true" /><span><strong>Alamat</strong>{site.address}</span></div>
          <div><Mail size={24} aria-hidden="true" /><span><strong>Email</strong>{emails.map((e) => <a key={e} href={`mailto:${e}`}>{e}</a>)}</span></div>
        </div>
        <p className="pd-intro ab-note" data-reveal="up">{hoursNote}</p>
      </section>

      <section className="pd-section">
        <p className="kicker" data-reveal="up"><span />Lokasi</p>
        <h2 data-reveal="up">Temukan Kami</h2>
        <div className="ab-map" data-reveal="up">
          <iframe title={`Peta lokasi ${site.site_name}`} src={`https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </section>

      <section className="pd-section">
        <p className="kicker" data-reveal="up"><span />Testimoni</p>
        <h2 data-reveal="up">Apa yang Mereka Katakan?</h2>
        <div data-reveal="up"><Testimonials items={TESTIMONIALS} /></div>
      </section>

      <section className="pd-video ab-cta" data-reveal="up">
        <div><p className="kicker kicker-light"><span />Pendaftaran</p><h2>Sekolah Terbaik dan Terfavorit di Kabupaten Batang</h2></div>
        <a className="btn btn-lime" href={site.spmb_url} target="_blank" rel="noopener noreferrer">Daftar Sekarang <ArrowRight size={17} aria-hidden="true" /></a>
      </section>
    </article>
  );
}
