import Link from 'next/link';
import { ArrowRight, CircleCheck } from 'lucide-react';
import SchoolImage from './SchoolImage';

export default function FacilityIndex({ data }) {
  const { heading, subtitle, cards, why } = data;
  return (
    <article className="article program-detail">
      <section className="pd-section">
        <p className="kicker" data-reveal="up"><span />Fasilitas Sekolah</p>
        <h2 data-reveal="up">{heading}</h2>
        {subtitle && <p className="pd-intro" data-reveal="up">{subtitle}</p>}
        <div className="fc-grid" data-stagger="up">
          {cards.map((c) => (
            <Link className="fc-card" href={`/${c.slug}`} key={c.slug}>
              <span className="fc-img"><SchoolImage src={c.image} alt={c.title} sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 420px" /></span>
              <span className="fc-body">
                <strong>{c.title}</strong>
                <span dangerouslySetInnerHTML={{ __html: c.text }} />
                <small>Lihat Detail <ArrowRight size={16} aria-hidden="true" /></small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="fc-why" data-reveal="up">
        {why.image && <SchoolImage src={why.image} sizes="(max-width:1024px) 100vw, 860px" />}
        <p className="kicker kicker-light"><span />{why.kicker}</p>
        <h2>{why.heading}</h2>
        <p className="fc-why-text" dangerouslySetInnerHTML={{ __html: why.text }} />
        <ul>
          {why.highlights.map((h) => (
            <li key={h.title}><CircleCheck size={22} aria-hidden="true" /><span><strong>{h.title}</strong>{h.text}</span></li>
          ))}
        </ul>
      </section>
    </article>
  );
}
