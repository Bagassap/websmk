import 'server-only';
import { unstable_cache } from 'next/cache';
import { all, one } from './db';
import { firstImage } from './format';
import { FACILITIES, FACILITY_PHOTOS, PROGRAMS } from './school';

export const CACHE_TAG = 'site';
const cached = (fn, key) => unstable_cache(fn, [key], { tags: [CACHE_TAG], revalidate: 300 });

const CARD = 'c.id, c.title, c.slug, c.excerpt, c.published_at, m.path AS image';
const JOIN = 'FROM contents c LEFT JOIN media m ON m.id = c.featured_media_id';
const NEWS_SIZE = 12;
const GALLERY_SIZE = 24;
const likeEscape = (s) => s.replace(/[\\%_]/g, '\\$&');
// TKD dan Archive SPMB tidak ditampilkan di menu, alamat lamanya tetap berfungsi.
const HIDDEN_MENU = new Set(['https://spmb.smklimpung.id/assesment', '/berita?q=SPMB']);

export const getSite = cached(async () => {
  const rows = await all('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}, 'site-settings');

export const getMenu = cached(async () => {
  const rows = (await all('SELECT id, parent_id, title, url FROM menu_items ORDER BY position, id')).filter((m) => !HIDDEN_MENU.has(m.url));
  return rows.filter((m) => !m.parent_id).map((m) => ({ ...m, children: rows.filter((c) => c.parent_id === m.id) }));
}, 'site-menu-v2');

export const getHome = cached(async () => {
  const [posts, pages, stats, teachers, gallery] = await Promise.all([
    all(`SELECT ${CARD} ${JOIN} WHERE c.type='post' AND c.status='publish' ORDER BY c.published_at DESC LIMIT 3`),
    all(`SELECT slug, content_html FROM contents WHERE type='page' AND slug = ANY($1)`, [[...PROGRAMS, ...FACILITIES].map((x) => x.slug).concat('fasilitas')]),
    one(`SELECT (SELECT count(*) FROM staff)::int AS staff, (SELECT count(*) FROM contents WHERE type='post' AND status='publish')::int AS posts`),
    all('SELECT id, name, role, photo FROM staff ORDER BY position, id LIMIT 4'),
    all(`SELECT path, title, alt FROM media WHERE in_gallery AND mime LIKE 'image/%' ORDER BY created_at DESC, id DESC LIMIT 5`),
  ]);
  const withImage = (x) => ({ ...x, image: firstImage(pages.find((p) => p.slug === x.slug)?.content_html) });
  const facilityImage = (x) => (FACILITY_PHOTOS[x.slug] ? { ...x, image: FACILITY_PHOTOS[x.slug] } : withImage(x));
  return { posts, programs: PROGRAMS.map(withImage), facilities: FACILITIES.map(facilityImage), stats, teachers, gallery };
}, 'home-v6');

export const getNews = cached(async (page, search, kategori) => {
  const where = ["c.type='post'", "c.status='publish'"];
  const params = [];
  if (search) {
    params.push(`%${likeEscape(search)}%`);
    where.push(`(c.title ILIKE $${params.length} OR c.excerpt ILIKE $${params.length})`);
  }
  if (kategori) {
    params.push(kategori);
    where.push(`EXISTS (SELECT 1 FROM content_terms ct JOIN terms t ON t.id = ct.term_id WHERE ct.content_id = c.id AND t.slug = $${params.length})`);
  }
  const clause = where.join(' AND ');
  const { total } = await one(`SELECT count(*)::int AS total FROM contents c WHERE ${clause}`, params);
  const posts = await all(`SELECT ${CARD} ${JOIN} WHERE ${clause} ORDER BY c.published_at DESC LIMIT ${NEWS_SIZE} OFFSET ${(page - 1) * NEWS_SIZE}`, params);
  return { posts, total, pages: Math.max(1, Math.ceil(total / NEWS_SIZE)) };
}, 'news');

export const getPost = cached(async (slug) => {
  const post = await one(`SELECT c.*, m.path AS image, m.alt AS image_alt ${JOIN} WHERE c.type='post' AND c.status='publish' AND c.slug=$1`, [slug]);
  if (!post) return null;
  const related = await all(`SELECT ${CARD} ${JOIN} WHERE c.type='post' AND c.status='publish' AND c.id <> $1 ORDER BY c.published_at DESC LIMIT 3 OFFSET 4`, [post.id]);
  return { post, related };
}, 'post-v2');

// Satu cadangan agar sidebar tetap berisi 4 berita saat berita terbaru sedang dibuka.
export const getLatestPosts = cached(
  () => all(`SELECT ${CARD} ${JOIN} WHERE c.type='post' AND c.status='publish' ORDER BY c.published_at DESC LIMIT 5`),
  'sidebar-latest',
);

export const getPage = cached(
  (slug) => one(`SELECT * FROM contents WHERE type='page' AND status='publish' AND slug=$1`, [slug]),
  'page',
);

export const getPostSlug = cached(async (slug) => {
  const r = await one(`SELECT slug FROM contents WHERE type='post' AND status='publish' AND slug=$1`, [slug]);
  return r?.slug ?? null;
}, 'post-slug');

export const getGallery = cached(async (page) => {
  const { total } = await one(`SELECT count(*)::int AS total FROM media WHERE in_gallery AND mime LIKE 'image/%'`);
  const items = await all(`SELECT path, title, alt FROM media WHERE in_gallery AND mime LIKE 'image/%' ORDER BY created_at DESC, id DESC LIMIT ${GALLERY_SIZE} OFFSET ${(page - 1) * GALLERY_SIZE}`);
  return { items, pages: Math.max(1, Math.ceil(total / GALLERY_SIZE)) };
}, 'gallery');

export const getStaff = cached(() => all('SELECT id, name, role, photo FROM staff ORDER BY position, id'), 'staff');

export const getSitemapRows = cached(
  () => all(`SELECT type, slug, updated_at FROM contents WHERE status='publish' AND redirect_url IS NULL ORDER BY published_at DESC`),
  'sitemap',
);

export const getFeedRows = cached(
  () => all(`SELECT title, slug, excerpt, published_at FROM contents WHERE type='post' AND status='publish' ORDER BY published_at DESC LIMIT 20`),
  'feed',
);

// Alamat lama WordPress: ?p=, ?page_id=, ?attachment_id=, ?s=, ?cat=, ?feed=
export async function resolveLegacy(sp) {
  const first = (k) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]);
  const id = Number(first('p') || first('page_id'));
  if (id) {
    const c = await one('SELECT type, slug FROM contents WHERE wp_id = $1 AND status = $2', [id, 'publish']);
    if (!c) return { notFound: true };
    return { to: c.type === 'post' ? `/berita/${c.slug}` : `/${c.slug}` };
  }
  const att = Number(first('attachment_id'));
  if (att) {
    const m = await one('SELECT path FROM media WHERE wp_id = $1', [att]);
    return m ? { to: `/uploads/${m.path}` } : { notFound: true };
  }
  if (typeof first('s') === 'string') return { to: `/berita?q=${encodeURIComponent(first('s'))}` };
  if (first('cat')) return { to: '/berita' };
  if (first('feed')) return { to: '/feed' };
  if (first('rest_route')) return { notFound: true };
  return null;
}
