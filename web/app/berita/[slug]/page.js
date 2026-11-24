import { notFound } from 'next/navigation';
import { Calendar, Eye } from 'lucide-react';
import NewsCard from '@/components/NewsCard';
import PageHero from '@/components/PageHero';
import SchoolImage from '@/components/SchoolImage';
import Sidebar from '@/components/Sidebar';
import ViewBeacon from '@/components/ViewBeacon';
import { getPost } from '@/lib/data';
import { fixContentLinks, fmtDate, isoDate } from '@/lib/format';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) return { title: 'Halaman tidak ditemukan' };
  const { post } = data;
  const description = post.seo_description || post.excerpt;
  return {
    title: post.seo_title || post.title,
    description,
    alternates: { canonical: `/berita/${post.slug}` },
    openGraph: { type: 'article', title: post.title, description, publishedTime: isoDate(post.published_at), images: post.image ? [`/uploads/${post.image}`] : [] },
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) notFound();
  const { post, related } = data;
  return (
    <>
      <PageHero title={post.title} eyebrow="Berita Sekolah" crumbs={[{ label: 'Berita', href: '/berita' }]}>
        <p className="post-meta" data-reveal="up" style={{ '--d': '220ms' }}>
          <span><Calendar size={16} aria-hidden="true" /><time dateTime={isoDate(post.published_at)}>{fmtDate(post.published_at)}</time></span>
          <span><Eye size={16} aria-hidden="true" />Dibaca {post.views.toLocaleString('id-ID')} kali</span>
        </p>
      </PageHero>
      <div className="wrap detail-layout">
        <article className="article">
          {post.image && <div className="article-figure" data-reveal="zoom"><SchoolImage src={`/uploads/${post.image}`} alt={post.image_alt || post.title} sizes="(max-width:1024px) 100vw, 860px" priority /></div>}
          <div className="prose" dangerouslySetInnerHTML={{ __html: fixContentLinks(post.content_html) }} />
        </article>
        <Sidebar currentPost={post.slug} />
      </div>
      {related.length > 0 && (
        <section className="section tint"><div className="wrap">
          <div className="section-head"><p className="kicker" data-reveal="up"><span />Baca Juga</p><h2 data-reveal="up">Berita <em>Lainnya</em></h2></div>
          <div className="grid" data-stagger="up">{related.map((p) => <NewsCard post={p} key={p.id} />)}</div>
        </div></section>
      )}
      <ViewBeacon slug={post.slug} />
    </>
  );
}
