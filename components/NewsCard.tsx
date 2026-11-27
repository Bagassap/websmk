import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import SchoolImage from './SchoolImage';
import type { PostCard } from '@/lib/data';
import { fmtDate, isoDate } from '@/lib/format';

export default function NewsCard({ post }: { post: PostCard }) {
  return (
    <article className="card" data-tilt>
      <Link className="card-img" href={`/berita/${post.slug}`} tabIndex={-1} aria-hidden="true">
        <SchoolImage src={post.image ? `/uploads/${post.image}` : ''} sizes="(max-width:600px) 100vw, (max-width:980px) 50vw, 380px" />
      </Link>
      <div className="card-body">
        <time dateTime={isoDate(post.published_at)}><Calendar size={14} aria-hidden="true" />{fmtDate(post.published_at)}</time>
        <h3><Link href={`/berita/${post.slug}`}>{post.title}</Link></h3>
        <p>{post.excerpt}</p>
        <Link className="more" href={`/berita/${post.slug}`} aria-label={`Baca ${post.title}`}>Baca selengkapnya <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </article>
  );
}
