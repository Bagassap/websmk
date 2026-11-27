import 'server-only';
import { unstable_cache } from 'next/cache';
import { all, one } from './db';
import { firstImage } from './format';
import { FACILITIES, FACILITY_PHOTOS, PROGRAMS } from './school';

export const CACHE_TAG = 'site';
const cached = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string) =>
  unstable_cache(fn, [key], { tags: [CACHE_TAG], revalidate: 300 });

export type Site = Record<string, string>;
export type MenuItem = { id: number; parent_id: number | null; title: string; url: string | null };
export type MenuNode = MenuItem & { children: MenuItem[] };
export type PostCard = { id: number; title: string; slug: string; excerpt: string; published_at: Date; image: string | null };
export type Post = PostCard & {
  content_html: string; seo_title: string; seo_description: string; views: number; image_alt: string | null; updated_at: Date;
};
export type Page = {
  id: number; title: string; slug: string; excerpt: string; content_html: string; seo_title: string; seo_description: string;
  redirect_url: string | null; updated_at: Date;
};
export type GalleryItem = { path: string; title: string; alt: string };
export type Staff = { id: number; name: string; role: string; photo: string };

const CARD = 'c.id, c.title, c.slug, c.excerpt, c.published_at, m.path AS image';
const JOIN = 'FROM contents c LEFT JOIN media m ON m.id = c.featured_media_id';
const NEWS_SIZE = 12;
const GALLERY_SIZE = 24;
const likeEscape = (s: string) => s.replace(/[\\%_]/g, '\\$&');
const count = async (sql: string, params?: unknown[]) => (await one<{ total: number }>(sql, params))?.total ?? 0;
// TKD dan Archive SPMB tidak ditampilkan di menu, alamat lamanya tetap berfungsi.
const HIDDEN_MENU = new Set(['https://spmb.smklimpung.id/assesment', '/berita?q=SPMB']);

export const getSite = cached(async (): Promise<Site> => {
  const rows = await all<{ key: string; value: string }>('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}, 'site-settings');

export const getMenu = cached(async (): Promise<MenuNode[]> => {
  const rows = (await all<MenuItem>('SELECT id, parent_id, title, url FROM menu_items ORDER BY position, id')).filter((m) => !HIDDEN_MENU.has(m.url || ''));
  return rows.filter((m) => !m.parent_id).map((m) => ({ ...m, children: rows.filter((c) => c.parent_id === m.id) }));
}, 'site-menu-v2');

export const getHome = cached(async () => {
  const [posts, pages, stats, teachers, gallery] = await Promise.all([
    all<PostCard>(`SELECT ${CARD} ${JOIN} WHERE c.type='post' AND c.status='publish' ORDER BY c.published_at DESC LIMIT 3`),
    all<{ slug: string; content_html: string }>(`SELECT slug, content_html FROM contents WHERE type='page' AND slug = ANY($1)`, [[...PROGRAMS, ...FACILITIES].map((x) => x.slug).concat('fasilitas')]),
    one<{ staff: number; posts: number }>(`SELECT (SELECT count(*) FROM staff)::int AS staff, (SELECT count(*) FROM contents WHERE type='post' AND status='publish')::int AS posts`),
    all<Staff>('SELECT id, name, role, photo FROM staff ORDER BY position, id LIMIT 4'),
    all<GalleryItem>(`SELECT path, title, alt FROM media WHERE in_gallery AND mime LIKE 'image/%' ORDER BY created_at DESC, id DESC LIMIT 5`),
  ]);
  const withImage = <T extends { slug: string }>(x: T) => ({ ...x, image: firstImage(pages.find((p) => p.slug === x.slug)?.content_html) });
  const facilityImage = <T extends { slug: string }>(x: T) => (FACILITY_PHOTOS[x.slug] ? { ...x, image: FACILITY_PHOTOS[x.slug] } : withImage(x));
  return {
    posts,
    programs: PROGRAMS.map(withImage),
    facilities: FACILITIES.map(facilityImage),
    stats: stats ?? { staff: 0, posts: 0 },
    teachers,
    gallery,
  };
}, 'home-v6');

export const getNews = cached(async (page: number, search: string, kategori: string) => {
  const where = ["c.type='post'", "c.status='publish'"];
  const params: unknown[] = [];
  if (search) {
    params.push(`%${likeEscape(search)}%`);
    where.push(`(c.title ILIKE $${params.length} OR c.excerpt ILIKE $${params.length})`);
  }
  if (kategori) {
    params.push(kategori);
    where.push(`EXISTS (SELECT 1 FROM content_terms ct JOIN terms t ON t.id = ct.term_id WHERE ct.content_id = c.id AND t.slug = $${params.length})`);
  }
  const clause = where.join(' AND ');
  const total = await count(`SELECT count(*)::int AS total FROM contents c WHERE ${clause}`, params);
  const posts = await all<PostCard>(`SELECT ${CARD} ${JOIN} WHERE ${clause} ORDER BY c.published_at DESC LIMIT ${NEWS_SIZE} OFFSET ${(page - 1) * NEWS_SIZE}`, params);
  return { posts, total, pages: Math.max(1, Math.ceil(total / NEWS_SIZE)) };
}, 'news');

export const getPost = cached(async (slug: string) => {
  const post = await one<Post>(`SELECT c.*, m.path AS image, m.alt AS image_alt ${JOIN} WHERE c.type='post' AND c.status='publish' AND c.slug=$1`, [slug]);
  if (!post) return null;
  const related = await all<PostCard>(`SELECT ${CARD} ${JOIN} WHERE c.type='post' AND c.status='publish' AND c.id <> $1 ORDER BY c.published_at DESC LIMIT 3 OFFSET 4`, [post.id]);
  return { post, related };
}, 'post-v2');

// Satu cadangan agar sidebar tetap berisi 4 berita saat berita terbaru sedang dibuka.
export const getLatestPosts = cached(
  () => all<PostCard>(`SELECT ${CARD} ${JOIN} WHERE c.type='post' AND c.status='publish' ORDER BY c.published_at DESC LIMIT 5`),
  'sidebar-latest',
);

export const getPage = cached(
  (slug: string) => one<Page>(`SELECT * FROM contents WHERE type='page' AND status='publish' AND slug=$1`, [slug]),
  'page',
);

export const getPostSlug = cached(async (slug: string) => {
  const r = await one<{ slug: string }>(`SELECT slug FROM contents WHERE type='post' AND status='publish' AND slug=$1`, [slug]);
  return r?.slug ?? null;
}, 'post-slug');

export const getGallery = cached(async (page: number) => {
  const total = await count(`SELECT count(*)::int AS total FROM media WHERE in_gallery AND mime LIKE 'image/%'`);
  const items = await all<GalleryItem>(`SELECT path, title, alt FROM media WHERE in_gallery AND mime LIKE 'image/%' ORDER BY created_at DESC, id DESC LIMIT ${GALLERY_SIZE} OFFSET ${(page - 1) * GALLERY_SIZE}`);
  return { items, pages: Math.max(1, Math.ceil(total / GALLERY_SIZE)) };
}, 'gallery');

export const getStaff = cached(() => all<Staff>('SELECT id, name, role, photo FROM staff ORDER BY position, id'), 'staff');

export const getSitemapRows = cached(
  () => all<{ type: string; slug: string; updated_at: Date }>(`SELECT type, slug, updated_at FROM contents WHERE status='publish' AND redirect_url IS NULL ORDER BY published_at DESC`),
  'sitemap',
);

export const getFeedRows = cached(
  () => all<{ title: string; slug: string; excerpt: string; published_at: Date }>(`SELECT title, slug, excerpt, published_at FROM contents WHERE type='post' AND status='publish' ORDER BY published_at DESC LIMIT 20`),
  'feed',
);

export type SearchParams = Record<string, string | string[] | undefined>;

// Alamat lama WordPress: ?p=, ?page_id=, ?attachment_id=, ?s=, ?cat=, ?feed=
export async function resolveLegacy(sp: SearchParams): Promise<{ to: string } | { notFound: true } | null> {
  const first = (k: string) => { const v = sp[k]; return Array.isArray(v) ? v[0] : v; };
  const id = Number(first('p') || first('page_id'));
  if (id) {
    const c = await one<{ type: string; slug: string }>('SELECT type, slug FROM contents WHERE wp_id = $1 AND status = $2', [id, 'publish']);
    if (!c) return { notFound: true };
    return { to: c.type === 'post' ? `/berita/${c.slug}` : `/${c.slug}` };
  }
  const att = Number(first('attachment_id'));
  if (att) {
    const m = await one<{ path: string }>('SELECT path FROM media WHERE wp_id = $1', [att]);
    return m ? { to: `/uploads/${m.path}` } : { notFound: true };
  }
  const s = first('s');
  if (typeof s === 'string') return { to: `/berita?q=${encodeURIComponent(s)}` };
  if (first('cat')) return { to: '/berita' };
  if (first('feed')) return { to: '/feed' };
  if (first('rest_route')) return { notFound: true };
  return null;
}
