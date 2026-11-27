import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import ContentForm, { type ContentFormItem } from '@/components/admin/ContentForm';
import { KINDS, kindOf, toWibInput, type ContentRow } from '@/lib/admin';
import { requireUser } from '@/lib/auth';
import { all, one } from '@/lib/db';

type Props = { params: Promise<{ kind: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kind, id } = await params;
  const { label } = KINDS[kindOf(kind)];
  return { title: id === 'baru' ? `Tambah ${label}` : `Edit ${label}` };
}

export default async function ContentEditPage({ params }: Props) {
  await requireUser();
  const p = await params;
  const kind = kindOf(p.kind);
  const { type, label } = KINDS[kind];
  if (p.id !== 'baru' && !/^\d+$/.test(p.id)) notFound();
  const id = p.id === 'baru' ? null : Number(p.id);

  let item: ContentFormItem = {
    id: null, title: '', slug: '', excerpt: '', content_html: '', status: 'draft', published_at: toWibInput(new Date()),
    featured_media_id: null, image: null, seo_title: '', seo_description: '',
  };
  let updated = 'baru';
  if (id) {
    const row = await one<ContentRow>(`SELECT c.*, m.path AS image FROM contents c LEFT JOIN media m ON m.id = c.featured_media_id WHERE c.id=$1 AND c.type=$2`, [id, type]);
    if (!row) redirect(`/admin/${kind}`);
    item = {
      id: row.id, title: row.title, slug: row.slug, excerpt: row.excerpt, content_html: row.content_html, status: row.status,
      published_at: toWibInput(row.published_at), featured_media_id: row.featured_media_id, image: row.image,
      seo_title: row.seo_title, seo_description: row.seo_description,
    };
    updated = new Date(row.updated_at).toISOString();
  }
  const isPost = type === 'post';
  const categories = isPost ? await all<{ id: number; name: string }>(`SELECT id, name FROM terms WHERE taxonomy='category' ORDER BY name`) : [];
  const selected = id ? (await all<{ term_id: number }>('SELECT term_id FROM content_terms WHERE content_id=$1', [id])).map((r) => r.term_id) : [];
  const title = id ? `Edit ${label}` : `Tambah ${label}`;

  return (
    <>
      <div className="bar">
        <h1>{title}</h1>
        {id && item.status === 'publish' && <a className="btn soft" target="_blank" rel="noopener" href={isPost ? `/berita/${item.slug}` : `/${item.slug}`}>Lihat</a>}
      </div>
      <ContentForm key={updated} kind={kind} isPost={isPost} item={item} categories={categories} selected={selected} />
    </>
  );
}
