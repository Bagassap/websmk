const express = require('express');
const he = require('he');
const { q, one, all } = require('./db');
const { firstImage } = require('./html');

const router = express.Router();
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const PER_PAGE = 12;
const CARD = `c.id, c.title, c.slug, c.excerpt, c.published_at, m.path AS image`;
const JOIN = 'FROM contents c LEFT JOIN media m ON m.id = c.featured_media_id';
const siteUrl = () => (process.env.SITE_URL || '').replace(/\/$/, '');
const likeEscape = (s) => s.replace(/[\\%_]/g, '\\$&');
const fmtDate = (d) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(d));

const PROGRAMS = [
  { slug: 'akuntansi', code: 'AKL', name: 'Akuntansi dan Keuangan Lembaga', text: 'Keterampilan mengelola keuangan, pencatatan transaksi, pajak, dan layanan perbankan.' },
  { slug: 'pemasaran', code: 'PM', name: 'Pemasaran', text: 'Prinsip ekonomi serta keterampilan menjual produk dan layanan jasa marketing.' },
  { slug: 'teknik-otomotif', code: 'TO', name: 'Teknik Otomotif', text: 'Perawatan dan pengembangan mesin sepeda motor melalui praktik di bengkel.' },
  { slug: 'pplg', code: 'PPLG', name: 'Pengembangan Perangkat Lunak dan GIM', text: 'Merancang dan membangun aplikasi, website, dan gim.' },
];

router.use(h(async (req, res, next) => {
  const [settings, menu] = await Promise.all([all('SELECT key, value FROM settings'), all('SELECT * FROM menu_items ORDER BY position, id')]);
  res.locals.site = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  res.locals.menu = menu.filter((m) => !m.parent_id).map((m) => ({ ...m, children: menu.filter((c) => c.parent_id === m.id) }));
  res.locals.currentPath = req.path;
  res.locals.fmtDate = fmtDate;
  res.locals.waLink = `https://wa.me/62${(res.locals.site.whatsapp || '').replace(/\D/g, '').replace(/^0/, '')}`;
  res.locals.meta = { title: '', description: res.locals.site.hero_text, image: '' };
  next();
}));

// Alamat lama WordPress: ?p=, ?page_id=, ?attachment_id=, ?s=, ?cat=, ?feed=
async function legacy(req, res, next) {
  const { p, page_id: pageId, attachment_id: att, s, cat, feed } = req.query;
  const id = Number(p || pageId);
  if (id) {
    const c = await one('SELECT type, slug FROM contents WHERE wp_id = $1 AND status = $2', [id, 'publish']);
    if (c) return res.redirect(301, c.type === 'post' ? `/berita/${c.slug}` : `/${c.slug}`);
    return notFound(req, res);
  }
  if (Number(att)) {
    const m = await one('SELECT path FROM media WHERE wp_id = $1', [Number(att)]);
    return m ? res.redirect(301, `/uploads/${m.path}`) : notFound(req, res);
  }
  if (typeof s === 'string') return res.redirect(301, `/berita?q=${encodeURIComponent(s)}`);
  if (cat) return res.redirect(301, '/berita');
  if (feed) return res.redirect(301, '/feed');
  if (req.query.rest_route) return res.status(404).end();
  return next();
}

function notFound(req, res) {
  res.locals.meta.title = 'Halaman tidak ditemukan';
  return res.status(404).render('404');
}

router.get(['/', '/index.php'], h(legacy), h(async (req, res) => {
  const [posts, pages, stats] = await Promise.all([
    all(`SELECT ${CARD} ${JOIN} WHERE c.type='post' AND c.status='publish' ORDER BY c.published_at DESC LIMIT 7`),
    all(`SELECT slug, content_html FROM contents WHERE type='page' AND slug = ANY($1)`, [PROGRAMS.map((x) => x.slug)]),
    one(`SELECT (SELECT count(*) FROM staff)::int AS staff, (SELECT count(*) FROM contents WHERE type='post' AND status='publish')::int AS posts`),
  ]);
  const programs = PROGRAMS.map((x) => ({ ...x, image: firstImage(pages.find((pg) => pg.slug === x.slug)?.content_html) }));
  res.render('home', { lead: posts[0], posts: posts.slice(1), programs, stats });
}));

router.get('/berita', h(async (req, res) => {
  const page = Math.max(1, Number(req.query.halaman) || 1);
  const search = String(req.query.q || '').trim().slice(0, 100);
  const kategori = String(req.query.kategori || '').slice(0, 100);
  const where = ["c.type='post'", "c.status='publish'"];
  const params = [];
  if (search) { params.push(`%${likeEscape(search)}%`); where.push(`(c.title ILIKE $${params.length} OR c.excerpt ILIKE $${params.length})`); }
  if (kategori) { params.push(kategori); where.push(`EXISTS (SELECT 1 FROM content_terms ct JOIN terms t ON t.id = ct.term_id WHERE ct.content_id = c.id AND t.slug = $${params.length})`); }
  const clause = where.join(' AND ');
  const { total } = await one(`SELECT count(*)::int AS total FROM contents c WHERE ${clause}`, params);
  const posts = await all(`SELECT ${CARD} ${JOIN} WHERE ${clause} ORDER BY c.published_at DESC LIMIT ${PER_PAGE} OFFSET ${(page - 1) * PER_PAGE}`, params);
  res.locals.meta.title = 'Berita';
  res.render('news', { posts, page, pages: Math.max(1, Math.ceil(total / PER_PAGE)), total, search, kategori });
}));

router.get('/berita/:slug', h(async (req, res) => {
  const post = await one(`SELECT c.*, m.path AS image, m.alt AS image_alt ${JOIN} WHERE c.type='post' AND c.status='publish' AND c.slug=$1`, [req.params.slug]);
  if (!post) return notFound(req, res);
  await q('UPDATE contents SET views = views + 1 WHERE id = $1', [post.id]);
  const related = await all(`SELECT ${CARD} ${JOIN} WHERE c.type='post' AND c.status='publish' AND c.id <> $1 ORDER BY c.published_at DESC LIMIT 3`, [post.id]);
  res.locals.meta = { title: post.seo_title || post.title, description: post.seo_description || post.excerpt, image: post.image ? `/uploads/${post.image}` : '' };
  res.render('post', { post, related });
}));

router.get('/galeri', h(async (req, res) => {
  const page = Math.max(1, Number(req.query.halaman) || 1);
  const { total } = await one(`SELECT count(*)::int AS total FROM media WHERE in_gallery AND mime LIKE 'image/%'`);
  const items = await all(`SELECT path, title, alt FROM media WHERE in_gallery AND mime LIKE 'image/%' ORDER BY created_at DESC, id DESC LIMIT 24 OFFSET ${(page - 1) * 24}`);
  res.locals.meta.title = 'Galeri';
  res.render('gallery', { items, page, pages: Math.max(1, Math.ceil(total / 24)) });
}));

router.get('/guru-dan-staff', h(async (req, res) => {
  res.locals.meta.title = 'Guru dan Staff';
  res.render('staff', { staff: await all('SELECT * FROM staff ORDER BY position, id') });
}));

router.get('/robots.txt', (req, res) => res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nSitemap: ${siteUrl()}/sitemap.xml\n`));

router.get('/sitemap.xml', h(async (req, res) => {
  const rows = await all(`SELECT type, slug, updated_at FROM contents WHERE status='publish' AND redirect_url IS NULL ORDER BY published_at DESC`);
  const urls = ['/', '/berita', '/galeri', ...rows.map((r) => (r.type === 'post' ? `/berita/${r.slug}` : `/${r.slug}`))];
  const dates = new Map(rows.map((r) => [r.type === 'post' ? `/berita/${r.slug}` : `/${r.slug}`, r.updated_at]));
  const body = urls.map((u) => `<url><loc>${he.escape(siteUrl() + u)}</loc>${dates.has(u) ? `<lastmod>${new Date(dates.get(u)).toISOString()}</lastmod>` : ''}</url>`).join('');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
}));

router.get('/feed', h(async (req, res) => {
  const rows = await all(`SELECT title, slug, excerpt, published_at FROM contents WHERE type='post' AND status='publish' ORDER BY published_at DESC LIMIT 20`);
  const items = rows.map((r) => `<item><title>${he.escape(r.title)}</title><link>${siteUrl()}/berita/${r.slug}</link><guid>${siteUrl()}/berita/${r.slug}</guid><pubDate>${new Date(r.published_at).toUTCString()}</pubDate><description>${he.escape(r.excerpt)}</description></item>`).join('');
  res.type('application/rss+xml').send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${he.escape(res.locals.site.site_name)}</title><link>${siteUrl()}/</link><description>Berita sekolah</description>${items}</channel></rss>`);
}));

router.get('/:slug', h(async (req, res) => {
  const slug = req.params.slug;
  const page = await one(`SELECT * FROM contents WHERE type='page' AND status='publish' AND slug=$1`, [slug]);
  if (page) {
    if (page.redirect_url) return res.redirect(301, page.redirect_url);
    res.locals.meta = { title: page.seo_title || page.title, description: page.seo_description || page.excerpt, image: firstImage(page.content_html) };
    return res.render('page', { page });
  }
  const post = await one(`SELECT slug FROM contents WHERE type='post' AND status='publish' AND slug=$1`, [slug]);
  if (post) return res.redirect(301, `/berita/${post.slug}`);
  return notFound(req, res);
}));

router.use((req, res) => notFound(req, res));

module.exports = router;
