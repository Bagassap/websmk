import ProgramArt from './ProgramArt';
import SchoolImage from './SchoolImage';
import VideoButton from './VideoButton';

export default function ProgramDetail({ program, data }) {
  const { heading, intro, image, concentrations, video, partners } = data;
  const photo = <SchoolImage src={image} alt={`Kegiatan siswa jurusan ${program.name}`} sizes="(max-width:1024px) 100vw, 860px" priority />;
  return (
    <article className="article program-detail">
      {image && (
        <figure className="pd-figure" data-reveal="zoom">
          <ProgramArt slug={program.slug} alt={`Siswa jurusan ${program.name}`} sizes="(max-width:1024px) 100vw, 860px" priority fallback={photo} />
          <figcaption><b>{program.code}</b>{program.name}</figcaption>
        </figure>
      )}

      <section className="pd-section">
        <p className="kicker" data-reveal="up"><span />Tentang Jurusan</p>
        <h2 data-reveal="up">{heading}</h2>
        <p className="pd-intro" data-reveal="up" dangerouslySetInnerHTML={{ __html: intro }} />
      </section>

      <section className="pd-section">
        <p className="kicker" data-reveal="up"><span />Pilihan Belajar</p>
        <h2 data-reveal="up">Konsentrasi Keahlian</h2>
        <div className={`pd-cards${concentrations.length === 1 ? ' single' : ''}`} data-stagger="up">
          {concentrations.map((c, i) => (
            <div className="pd-card" key={c.title}>
              <span className="pd-no" aria-hidden="true">0{i + 1}</span>
              <h3>{c.title}</h3>
              <p dangerouslySetInnerHTML={{ __html: c.text }} />
            </div>
          ))}
        </div>
      </section>

      {video && (
        <section className="pd-video" data-reveal="up">
          {image && <SchoolImage src={image} sizes="(max-width:1024px) 100vw, 860px" />}
          <div>
            <p className="kicker kicker-light"><span />Video Jurusan</p>
            <h2>Lihat Kegiatan {program.name}</h2>
          </div>
          <VideoButton id={video} title={`Video jurusan ${program.name}`} />
        </section>
      )}

      {partners.length > 0 && (
        <section className="pd-section">
          <p className="kicker" data-reveal="up"><span />Kerja Sama</p>
          <h2 data-reveal="up">Mitra Industri dan Organisasi</h2>
          <div className="pd-partners" data-stagger="up">
            {partners.map((p) => <div key={p.src}><span aria-hidden="true">{p.name}</span><SchoolImage src={p.src} alt={`Logo ${p.name}`} sizes="140px" /></div>)}
          </div>
        </section>
      )}
    </article>
  );
}
