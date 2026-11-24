import { CircleCheck } from 'lucide-react';
import SchoolImage from './SchoolImage';
import VideoButton from './VideoButton';

export default function FacilityDetail({ data }) {
  const { title, heading, intro, image, listTitle, lead, items, note, closing, video } = data;
  return (
    <article className="article program-detail">
      {image && (
        <figure className="pd-figure" data-reveal="zoom">
          <SchoolImage src={image} alt={title} sizes="(max-width:1024px) 100vw, 860px" priority />
          <figcaption><b>Fasilitas</b>{title}</figcaption>
        </figure>
      )}

      <section className="pd-section">
        <p className="kicker" data-reveal="up"><span />Tentang Fasilitas</p>
        <h2 data-reveal="up">{heading === title ? `Mengenal ${title}` : heading}</h2>
        <p className="pd-intro" data-reveal="up" dangerouslySetInnerHTML={{ __html: intro }} />
      </section>

      {listTitle && (
        <section className="pd-section">
          <p className="kicker" data-reveal="up"><span />Yang Tersedia</p>
          <h2 data-reveal="up">{listTitle}</h2>
          {lead && <p className="pd-intro" data-reveal="up" dangerouslySetInnerHTML={{ __html: lead }} />}
          {items.length > 0 && (
            <ul className="fc-list" data-stagger="up">
              {items.map((item) => <li key={item}><CircleCheck size={20} aria-hidden="true" />{item}</li>)}
            </ul>
          )}
          {note && <p className="pd-intro fc-after" data-reveal="up" dangerouslySetInnerHTML={{ __html: note }} />}
        </section>
      )}

      {closing && <blockquote className="fc-note" data-reveal="up" dangerouslySetInnerHTML={{ __html: closing }} />}

      {video && (
        <section className="pd-video" data-reveal="up">
          {image && <SchoolImage src={image} sizes="(max-width:1024px) 100vw, 860px" />}
          <div>
            <p className="kicker kicker-light"><span />Video Profil</p>
            <h2>Lihat Suasana Sekolah Kami</h2>
          </div>
          <VideoButton id={video} title="Video profil sekolah" />
        </section>
      )}
    </article>
  );
}
