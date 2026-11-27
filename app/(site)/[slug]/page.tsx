import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { ActivitiesPage, ContactPage, HistoryPage, ProfilePage } from '@/components/AboutPages';
import FacilityDetail from '@/components/FacilityDetail';
import FacilityIndex from '@/components/FacilityIndex';
import PageHero from '@/components/PageHero';
import ProgramDetail from '@/components/ProgramDetail';
import Sidebar from '@/components/Sidebar';
import { parseActivities, parseContact, parseHistory, parseProfile } from '@/lib/about';
import { getPage, getPostSlug, getSite } from '@/lib/data';
import { FACILITY_SLUGS, parseFacility, parseFacilityIndex, type FacilityData } from '@/lib/facility';
import { firstImage, fixContentLinks, ogImage } from '@/lib/format';
import { parseProgram, plain } from '@/lib/program';
import { FACILITY_PHOTOS, PROGRAMS } from '@/lib/school';

// Isi Business Center di WordPress masih teks contoh template,
// sehingga yang ditampilkan adalah deskripsi aslinya dari halaman Fasilitas.
async function businessCenter(): Promise<FacilityData | null> {
  const parent = await getPage('fasilitas');
  const card = parseFacilityIndex(parent?.content_html)?.cards.find((c) => c.slug === 'business-center');
  return card ? { title: card.title, heading: card.title, intro: card.text, image: card.image, items: [] } : null;
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: 'Halaman tidak ditemukan' };
  const siteName = (await getSite()).site_name;
  if (slug === 'business-center') {
    const bc = await businessCenter();
    if (bc) {
      const text = plain(bc.intro);
      return { title: bc.title, description: text, alternates: { canonical: '/business-center' }, openGraph: { title: bc.title, description: text, url: '/business-center', siteName, locale: 'id_ID', images: [ogImage(bc.image, bc.title)] } };
    }
  }
  const image = firstImage(page.content_html);
  const description = page.seo_description || page.excerpt;
  return {
    title: slug === 'contact-us' ? 'Hubungi Kami' : page.seo_title || page.title,
    description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: { title: page.title, description, url: `/${page.slug}`, siteName, locale: 'id_ID', images: [ogImage(image, page.title)] },
  };
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) {
    const post = await getPostSlug(slug);
    if (post) permanentRedirect(`/berita/${post}`);
    notFound();
  }
  if (page.redirect_url) permanentRedirect(page.redirect_url);
  const site = await getSite();

  const program = PROGRAMS.find((p) => p.slug === page.slug);
  const programData = program ? parseProgram(page.content_html) : null;
  const facilityIndex = page.slug === 'fasilitas' ? parseFacilityIndex(page.content_html) : null;
  let facility: FacilityData | null = null;
  if (page.slug === 'business-center') facility = await businessCenter();
  else if (FACILITY_SLUGS.has(page.slug)) facility = parseFacility(page.content_html);
  if (facility && FACILITY_PHOTOS[page.slug]) facility = { ...facility, image: FACILITY_PHOTOS[page.slug] };

  const profile = page.slug === 'tentang-kami' ? parseProfile(page.content_html) : null;
  const history = page.slug === 'sejarah-singkat' ? parseHistory(page.content_html) : null;
  const contact = page.slug === 'contact-us' ? parseContact(page.content_html) : null;
  const activities = page.slug === 'ekstrakurikuler' ? parseActivities(page.content_html) : null;
  const isAbout = profile || history || contact;

  const title = programData && program ? program.name : facility?.title || (contact ? 'Hubungi Kami' : page.title);
  const eyebrow = programData ? 'Program Keahlian' : facility || facilityIndex ? 'Fasilitas Sekolah' : activities ? 'Kegiatan Siswa' : isAbout ? 'Tentang Kami' : site.tagline;
  const crumbs = facility ? [{ label: 'Fasilitas', href: '/fasilitas' }, { label: title }] : [{ label: title }];

  let body = <article className="article prose page-prose" dangerouslySetInnerHTML={{ __html: fixContentLinks(page.content_html) }} />;
  if (profile) body = <ProfilePage data={profile} />;
  else if (history) body = <HistoryPage data={history} />;
  else if (contact) body = <ContactPage data={contact} site={site} />;
  else if (activities) body = <ActivitiesPage data={activities} />;
  else if (programData && program) body = <ProgramDetail program={program} data={programData} />;
  else if (facilityIndex) body = <FacilityIndex data={facilityIndex} />;
  else if (facility) body = <FacilityDetail data={facility} />;

  return (
    <>
      <PageHero title={title} eyebrow={eyebrow} crumbs={crumbs} />
      <div className="wrap detail-layout">
        {body}
        <Sidebar currentPage={page.slug} />
      </div>
    </>
  );
}
