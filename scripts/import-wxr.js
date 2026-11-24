// Aman dijalankan berulang: data yang sudah diedit di admin tidak ditimpa.
const he = require('he');
const { pool } = require('../src/db');
const { findExport, readExport, sha256 } = require('./wxr');
const { cleanHtml, excerpt, localizeUrls } = require('../src/html');

const REDIRECTS = { home: '/', blog: '/berita', tkd: 'https://spmb.smklimpung.id/assesment', 'elementor-3731': '/berita?q=SPMB', '404-not-found': '/' };
const MENU_TITLES = { Home: 'Beranda', Blog: 'Berita', 'Contact Us': 'Hubungi Kami' };
const SETTINGS = {
  site_name: "SMK Ma'arif NU 01 Limpung",
  tagline: 'Kreatif - Religius - Nasionalis',
  hero_title: "SMK Ma'arif NU 01 Limpung",
  hero_text: 'Dikenal sebagai Sekolah Keren, akronim dari Kreatif, Religius, dan Nasionalis, dengan 1.500 peserta didik di Kabupaten Batang.',
  about_text: 'Pendidikan di sekolah ini dikembangkan dengan mengkombinasikan tiga nilai, yaitu kreativitas, spiritualitas, dan cinta tanah air. Ketiga nilai tersebut diwujudkan dalam aneka program sekolah.',
  address: 'Jl. KH. Wahid Hasyim No. 01 Limpung, Batang, Jawa Tengah',
  whatsapp: '0857-8602-2510',
  email: 'smkmaarifnu01limpung@gmail.com',
  email_2: 'sekolahkerenofficial@gmail.com',
  hours: 'Senin - Jumat, 07.00 - 15.00 WIB',
  spmb_url: 'https://spmb.smklimpung.id',
};

const seoValue = (v) => (v && !v.includes('#') ? he.decode(v).trim() : '');
const utc = (d, fallback) => (d && !d.startsWith('0000') ? `${d.replace(' ', 'T')}Z` : fallback ? `${fallback.replace(' ', 'T')}+07:00` : new Date().toISOString());

// Di halaman guru, tiap kolom berisi widget foto (team) dan widget nama/jabatan (icon-box).
function walkStaff(nodes, out = []) {
  for (const n of nodes || []) {
    const kids = n.elements || [];
    const box = kids.find((k) => k.widgetType === 'icon-box');
    const team = kids.find((k) => k.widgetType === 'elementskit-team');
    if (box) out.push({ name: box.settings?.title_text, role: box.settings?.description_text, photo: team?.settings?.ekit_team_image?.url });
    walkStaff(kids, out);
  }
  return out;
}

(async () => {
  const file = findExport(process.argv[2]);
  const { items } = readExport(file);
  const byId = new Map(items.map((i) => [i.id, i]));
  const db = await pool.connect();
  try {
    await db.query('BEGIN');

    for (const i of items) {
      const data = { link: i.link, date: i.date, localDate: i.localDate, modified: i.modified, parent: i.parent, order: i.order,
        excerpt: i.excerpt, attachmentUrl: i.attachmentUrl, meta: i.meta, terms: i.terms, comments: i.comments };
      await db.query(`INSERT INTO wp_archive (wp_id, post_type, status, title, slug, raw_content, raw_sha256, data)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (wp_id) DO NOTHING`,
      [i.id, i.type, i.status, i.title, i.slug, i.content, sha256(i.content), JSON.stringify(data)]);
    }

    const thumbs = new Set(items.filter((i) => i.type === 'post').map((i) => Number(i.metaMap._thumbnail_id)).filter(Boolean));
    const mediaIds = new Map();
    for (const a of items.filter((i) => i.type === 'attachment')) {
      const rel = a.metaMap._wp_attached_file || a.attachmentUrl.split('/wp-content/uploads/')[1] || `wp-${a.id}`;
      const ext = rel.split('.').pop().toLowerCase();
      const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', ttf: 'font/ttf', woff: 'font/woff' }[ext] || '';
      const r = await db.query(`INSERT INTO media (wp_id, title, alt, path, mime, in_gallery, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (wp_id) DO UPDATE SET wp_id = EXCLUDED.wp_id RETURNING id`,
      [a.id, he.decode(a.title), he.decode(a.metaMap._wp_attachment_image_alt || ''), rel, mime, thumbs.has(a.id), utc(a.date, a.localDate)]);
      mediaIds.set(a.id, r.rows[0].id);
    }

    const termIds = new Map();
    for (const i of items.filter((x) => x.type === 'post')) {
      for (const t of i.terms) {
        const tax = t.domain === 'category' ? 'category' : t.domain === 'post_tag' ? 'tag' : null;
        if (!tax) continue;
        const r = await db.query(`INSERT INTO terms (taxonomy, slug, name) VALUES ($1,$2,$3)
          ON CONFLICT (taxonomy, slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING id`, [tax, t.slug, he.decode(t.name)]);
        termIds.set(`${tax}:${t.slug}`, r.rows[0].id);
      }
    }

    for (const i of items.filter((x) => x.type === 'post' || x.type === 'page')) {
      const html = cleanHtml(i.content);
      const r = await db.query(`INSERT INTO contents (wp_id, type, title, slug, excerpt, content_html, status, featured_media_id,
          seo_title, seo_description, redirect_url, views, published_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (wp_id) DO NOTHING RETURNING id`,
      [i.id, i.type, he.decode(i.title), i.slug || `wp-${i.id}`, i.excerpt.trim() ? excerpt(i.excerpt) : excerpt(html),
        html, ['publish', 'draft'].includes(i.status) ? i.status : 'draft', mediaIds.get(Number(i.metaMap._thumbnail_id)) || null,
        seoValue(i.metaMap._aioseo_title), seoValue(i.metaMap._aioseo_description),
        i.type === 'page' ? REDIRECTS[i.slug] || null : null, Number(i.metaMap.ekit_post_views_count) || 0,
        utc(i.date, i.localDate), utc(i.modified, i.localDate)]);
      if (r.rows[0]) {
        for (const t of i.terms) {
          const id = termIds.get(`${t.domain === 'category' ? 'category' : 'tag'}:${t.slug}`);
          if (id) await db.query('INSERT INTO content_terms VALUES ($1,$2) ON CONFLICT DO NOTHING', [r.rows[0].id, id]);
        }
      }
    }

    const nav = items.filter((i) => i.type === 'nav_menu_item').sort((a, b) => a.order - b.order);
    const navIds = new Map();
    const navUrl = (n) => {
      if (n.metaMap._menu_item_type !== 'post_type') {
        const u = n.metaMap._menu_item_url;
        return !u || u === '#' ? null : localizeUrls(u);
      }
      const page = byId.get(Number(n.metaMap._menu_item_object_id));
      if (!page) return null;
      return REDIRECTS[page.slug] || `/${page.slug}`;
    };
    for (const n of nav) {
      const target = byId.get(Number(n.metaMap._menu_item_object_id));
      const raw = he.decode(n.title || target?.title || '');
      const r = await db.query(`INSERT INTO menu_items (wp_id, title, url, position) VALUES ($1,$2,$3,$4)
        ON CONFLICT (wp_id) DO UPDATE SET wp_id = EXCLUDED.wp_id RETURNING id`, [n.id, MENU_TITLES[raw] || raw, navUrl(n), n.order]);
      navIds.set(n.id, r.rows[0].id);
    }
    for (const n of nav) {
      const parent = navIds.get(Number(n.metaMap._menu_item_menu_item_parent));
      if (parent) await db.query('UPDATE menu_items SET parent_id = $1 WHERE id = $2', [parent, navIds.get(n.id)]);
    }
    await db.query(`INSERT INTO menu_items (title, url, position) SELECT 'Galeri', '/galeri', 8
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE url = '/galeri')`);

    const guru = items.find((i) => i.type === 'page' && i.slug === 'guru-dan-staff');
    if (guru?.metaMap._elementor_data) {
      const members = walkStaff(JSON.parse(guru.metaMap._elementor_data));
      for (const [idx, s] of members.entries()) {
        const name = he.decode(String(s.name || '')).trim();
        if (!name) continue;
        await db.query('INSERT INTO staff (name, role, photo, position) VALUES ($1,$2,$3,$4) ON CONFLICT (name, role) DO NOTHING',
          [name, he.decode(String(s.role || '')).trim(), localizeUrls(s.photo || ''), idx]);
      }
    }

    for (const [k, v] of Object.entries(SETTINGS)) {
      await db.query('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING', [k, v]);
    }

    await db.query('COMMIT');
    console.log(`Impor selesai dari ${file.split(/[\\/]/).pop()}: ${items.length} entri.`);
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  } finally {
    db.release();
    await pool.end();
  }
})().catch((e) => { console.error('Impor gagal, tidak ada perubahan disimpan:', e); process.exit(1); });
