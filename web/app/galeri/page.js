import PageHero from '@/components/PageHero';
import Pager from '@/components/Pager';
import SchoolImage from '@/components/SchoolImage';
import { getGallery } from '@/lib/data';
import { pageNumber } from '@/lib/format';

export const metadata = { title: 'Galeri' };

export default async function GalleryPage({ searchParams }) {
  const page = pageNumber((await searchParams).halaman);
  const { items, pages } = await getGallery(page);
  return (
    <>
      <PageHero title="Galeri Kegiatan" eyebrow="Dokumentasi" crumbs={[{ label: 'Galeri' }]} />
      <section className="section"><div className="wrap">
        <div className="gallery" data-stagger="zoom" key={page}>
          {items.map((m) => (
            <a href={`/uploads/${m.path}`} key={m.path}>
              <SchoolImage src={`/uploads/${m.path}`} alt={m.alt || m.title} sizes="(max-width:600px) 50vw, 300px" />
            </a>
          ))}
        </div>
        <Pager base="/galeri" page={page} pages={pages} />
      </div></section>
    </>
  );
}
