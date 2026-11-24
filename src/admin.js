const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const { pool, q, one, all } = require('./db');
const { cleanHtml, excerpt, slugify } = require('./html');
const { hashPassword, verifyPassword } = require('./password');

const router = express.Router();
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const uploadDir = path.join(__dirname, '..', 'storage', 'uploads');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });
const TYPES = { berita: { type: 'post', label: 'Berita' }, halaman: { type: 'page', label: 'Halaman' } };
const SETTING_FIELDS = [['site_name', 'Nama sekolah'], ['tagline', 'Slogan'], ['hero_title', 'Judul beranda'], ['hero_text', 'Teks beranda'],
  ['about_text', 'Teks tentang sekolah'], ['address', 'Alamat'], ['whatsapp', 'WhatsApp'], ['email', 'Email utama'], ['email_2', 'Email kedua'], ['hours', 'Jam operasional'], ['spmb_url', 'Link pendaftaran SPMB']];

const attempts = new Map();
const WINDOW = 15 * 60 * 1000;
function limited(ip) {
  const a = attempts.get(ip);
  if (!a || Date.now() - a.at > WINDOW) return false;
  return a.count >= 8;
}
function failed(ip) {
  const a = attempts.get(ip);
  if (!a || Date.now() - a.at > WINDOW) attempts.set(ip, { count: 1, at: Date.now() });
  else a.count += 1;
}

function imageExt(b) {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ['jpg', 'image/jpeg'];
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ['png', 'image/png'];
  if (b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return ['webp', 'image/webp'];
  if (b.length > 6 && ['GIF87a', 'GIF89a'].includes(b.toString('latin1', 0, 6))) return ['gif', 'image/gif'];
  return null;
}

function csrfOk(req) {
  const sent = String(req.get('x-csrf-token') || req.body?._csrf || '');
  const real = String(req.session?.csrf || '');
  return real.length > 0 && sent.length === real.length && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(real));
}
const csrf = (req, res, next) => (csrfOk(req) ? next() : res.status(403).send('Sesi formulir tidak valid. Muat ulang halaman lalu coba lagi.'));

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Robots-Tag', 'noindex');
  if (req.session && !req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  res.locals.csrf = req.session.csrf;
  res.locals.user = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  res.locals.path = req.baseUrl + req.path;
  res.locals.fmt = (d) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(new Date(d));
  next();
});

router.get('/login', (req, res) => (req.session.user ? res.redirect('/admin') : res.render('admin/login', { error: null })));

router.post('/login', csrf, h(async (req, res) => {
  if (limited(req.ip)) return res.status(429).render('admin/login', { error: 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.' });
  const u = await one('SELECT * FROM users WHERE username = $1', [String(req.body.username || '').trim()]);
  const ok = await verifyPassword(String(req.body.password || ''), u?.password_hash || 'scrypt$00$00');
  if (!u || !ok) {
    failed(req.ip);
    return res.status(401).render('admin/login', { error: 'Username atau password salah.' });
  }
  attempts.delete(req.ip);
  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.user = { id: u.id, name: u.name, mustChange: u.must_change_password };
    req.session.csrf = crypto.randomBytes(24).toString('hex');
    req.session.save(() => res.redirect(u.must_change_password ? '/admin/password' : '/admin'));
  });
}));

router.use((req, res, next) => (req.session.user ? next() : res.redirect('/admin/login')));

router.post('/logout', csrf, (req, res) => req.session.destroy(() => res.clearCookie('smk.sid', { path: '/admin' }).redirect('/admin/login')));

router.get('/password', (req, res) => res.render('admin/password', { error: null }));
router.post('/password', csrf, h(async (req, res) => {
  const { current = '', next: nextPw = '', confirm = '' } = req.body;
  const u = await one('SELECT * FROM users WHERE id = $1', [req.session.user.id]);
  let error = null;
  if (!(await verifyPassword(current, u.password_hash))) error = 'Password saat ini salah.';
  else if (nextPw.length < 10) error = 'Password baru minimal 10 karakter.';
  else if (nextPw !== confirm) error = 'Konfirmasi password tidak sama.';
  else if (nextPw === current) error = 'Password baru harus berbeda.';
  if (error) return res.status(400).render('admin/password', { error });
  await q('UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2', [await hashPassword(nextPw), u.id]);
  await q(`DELETE FROM user_sessions WHERE sid <> $1 AND (sess->'user'->>'id')::int = $2`, [req.sessionID, u.id]);
  req.session.user.mustChange = false;
  req.session.flash = 'Password berhasil diganti.';
  res.redirect('/admin');
}));

router.use((req, res, next) => (req.session.user.mustChange ? res.redirect('/admin/password') : next()));

// Setelah admin menyimpan perubahan, cache website Next.js diperbarui.
router.use((req, res, next) => {
  if (req.method === 'POST') {
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      fetch(`${process.env.FRONTEND_URL || 'http://127.0.0.1:3000'}/api/revalidate`, {
        method: 'POST',
        headers: { 'x-revalidate-secret': process.env.REVALIDATE_SECRET || '' },
        signal: AbortSignal.timeout(5000),
      }).then((r) => { if (!r.ok) console.error(`Gagal memperbarui cache website: ${r.status}`); })
        .catch((e) => console.error('Gagal memperbarui cache website:', e.message));
    });
  }
  next();
});

router.get('/', h(async (req, res) => {
  const stats = await one(`SELECT
    (SELECT count(*) FROM contents WHERE type='post' AND status='publish')::int AS posts,
    (SELECT count(*) FROM contents WHERE type='page' AND status='publish')::int AS pages,
    (SELECT count(*) FROM media)::int AS media,
    (SELECT count(*) FROM staff)::int AS staff,
    (SELECT count(*) FROM contents WHERE status='draft')::int AS drafts,
    (SELECT count(*) FROM contents WHERE status='trash')::int AS trash,
    (SELECT count(*) FROM media WHERE in_gallery)::int AS gallery,
    (SELECT COALESCE(sum(views), 0)::int FROM contents WHERE type='post' AND status='publish') AS views`);
  const recent = await all(`SELECT id, title, status, updated_at FROM contents WHERE type='post' ORDER BY updated_at DESC LIMIT 6`);
  const months = await all(`SELECT to_char(m, 'YYYY-MM') AS key, count(c.id)::int AS n
    FROM generate_series(date_trunc('month', now() AT TIME ZONE 'Asia/Jakarta') - interval '6 months', date_trunc('month', now() AT TIME ZONE 'Asia/Jakarta'), interval '1 month') m
    LEFT JOIN contents c ON c.type='post' AND c.status='publish' AND date_trunc('month', c.published_at AT TIME ZONE 'Asia/Jakarta') = m
    GROUP BY m ORDER BY m`);
  res.render('admin/dashboard', { stats, recent, months });
}));

async function uniqueSlug(type, wanted, id) {
  const base = slugify(wanted);
  for (let n = 1; ; n += 1) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (!(await one('SELECT id FROM contents WHERE type=$1 AND slug=$2 AND id IS DISTINCT FROM $3', [type, slug, id || null]))) return slug;
  }
}

router.get('/:kind(berita|halaman)', h(async (req, res) => {
  const cfg = TYPES[req.params.kind];
  const page = Math.max(1, Number(req.query.halaman) || 1);
  const search = String(req.query.q || '').trim().slice(0, 100);
  const status = ['publish', 'draft', 'trash'].includes(req.query.status) ? req.query.status : '';
  const params = [cfg.type];
  let where = 'type = $1';
  if (status) { params.push(status); where += ` AND status = $${params.length}`; } else where += " AND status <> 'trash'";
  if (search) { params.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`); where += ` AND title ILIKE $${params.length}`; }
  const { total } = await one(`SELECT count(*)::int AS total FROM contents WHERE ${where}`, params);
  const rows = await all(`SELECT id, title, slug, status, published_at, views FROM contents WHERE ${where} ORDER BY published_at DESC LIMIT 20 OFFSET ${(page - 1) * 20}`, params);
  res.render('admin/content-list', { ...cfg, kind: req.params.kind, rows, page, pages: Math.max(1, Math.ceil(total / 20)), total, search, status });
}));

const formData = async (kind, item) => ({
  ...TYPES[kind], kind, item,
  categories: await all(`SELECT id, name FROM terms WHERE taxonomy='category' ORDER BY name`),
  selected: item?.id ? (await all('SELECT term_id FROM content_terms WHERE content_id=$1', [item.id])).map((r) => r.term_id) : [],
  error: null,
});

router.get('/:kind(berita|halaman)/baru', h(async (req, res) => {
  res.render('admin/content-form', await formData(req.params.kind, { title: '', slug: '', excerpt: '', content_html: '', status: 'draft', seo_title: '', seo_description: '', published_at: new Date() }));
}));

router.get('/:kind(berita|halaman)/:id(\\d+)', h(async (req, res) => {
  const item = await one(`SELECT c.*, m.path AS image FROM contents c LEFT JOIN media m ON m.id = c.featured_media_id WHERE c.id=$1 AND c.type=$2`, [req.params.id, TYPES[req.params.kind].type]);
  if (!item) return res.redirect(`/admin/${req.params.kind}`);
  res.render('admin/content-form', await formData(req.params.kind, item));
}));

router.post('/:kind(berita|halaman)/:id(\\d+|baru)', csrf, h(async (req, res) => {
  const { kind } = req.params;
  const { type } = TYPES[kind];
  const id = req.params.id === 'baru' ? null : Number(req.params.id);
  const b = req.body;
  const title = String(b.title || '').trim().slice(0, 300);
  const html = cleanHtml(b.content_html);
  if (!title) {
    return res.status(400).render('admin/content-form', { ...(await formData(kind, { ...b, id })), error: 'Judul wajib diisi.' });
  }
  const slug = await uniqueSlug(type, b.slug || title, id);
  const status = ['publish', 'draft', 'trash'].includes(b.status) ? b.status : 'draft';
  const date = new Date(b.published_at);
  const publishedAt = Number.isNaN(date.getTime()) ? new Date() : date;
  const featured = Number(b.featured_media_id) || null;
  const values = [title, slug, String(b.excerpt || '').trim() || excerpt(html), html, status, featured, String(b.seo_title || '').trim(), String(b.seo_description || '').trim(), publishedAt];
  const db = await pool.connect();
  let savedId = id;
  try {
    await db.query('BEGIN');
    if (id) {
      await db.query(`UPDATE contents SET title=$1, slug=$2, excerpt=$3, content_html=$4, status=$5, featured_media_id=$6, seo_title=$7, seo_description=$8, published_at=$9, updated_at=now() WHERE id=$10 AND type=$11`, [...values, id, type]);
    } else {
      savedId = (await db.query(`INSERT INTO contents (title, slug, excerpt, content_html, status, featured_media_id, seo_title, seo_description, published_at, type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, [...values, type])).rows[0].id;
    }
    if (type === 'post') {
      await db.query(`DELETE FROM content_terms WHERE content_id=$1 AND term_id IN (SELECT id FROM terms WHERE taxonomy='category')`, [savedId]);
      for (const c of [].concat(b.categories || [])) {
        await db.query(`INSERT INTO content_terms SELECT $1, id FROM terms WHERE id=$2 AND taxonomy='category' ON CONFLICT DO NOTHING`, [savedId, Number(c)]);
      }
    }
    await db.query('COMMIT');
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  } finally {
    db.release();
  }
  req.session.flash = 'Perubahan tersimpan.';
  res.redirect(`/admin/${kind}/${savedId}`);
}));

router.post('/:kind(berita|halaman)/:id(\\d+)/trash', csrf, h(async (req, res) => {
  await q(`UPDATE contents SET status='trash', updated_at=now() WHERE id=$1 AND type=$2`, [req.params.id, TYPES[req.params.kind].type]);
  req.session.flash = 'Dipindahkan ke Sampah. Data masih bisa dipulihkan.';
  res.redirect(`/admin/${req.params.kind}`);
}));

router.get('/media', h(async (req, res) => {
  const page = Math.max(1, Number(req.query.halaman) || 1);
  const { total } = await one(`SELECT count(*)::int AS total FROM media WHERE mime LIKE 'image/%'`);
  const rows = await all(`SELECT * FROM media WHERE mime LIKE 'image/%' ORDER BY created_at DESC, id DESC LIMIT 30 OFFSET ${(page - 1) * 30}`);
  res.render('admin/media', { rows, page, pages: Math.max(1, Math.ceil(total / 30)), total });
}));

router.post('/media/upload', upload.single('file'), csrf, h(async (req, res) => {
  const wantsJson = req.get('accept')?.includes('json');
  const fail = (msg) => {
    if (wantsJson) return res.status(400).json({ error: msg });
    req.session.flash = msg;
    return res.redirect('/admin/media');
  };
  if (!req.file) return fail('Pilih file gambar.');
  const kind = imageExt(req.file.buffer);
  if (!kind) return fail('Format harus JPG, PNG, WEBP, atau GIF.');
  const now = new Date();
  const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const name = `${slugify(path.parse(req.file.originalname).name).slice(0, 60)}-${crypto.randomBytes(4).toString('hex')}.${kind[0]}`;
  fs.mkdirSync(path.join(uploadDir, dir), { recursive: true });
  await fs.promises.writeFile(path.join(uploadDir, dir, name), req.file.buffer, { flag: 'wx' });
  const title = String(req.body.title || path.parse(req.file.originalname).name).slice(0, 200);
  const m = await one('INSERT INTO media (title, alt, path, mime, in_gallery) VALUES ($1,$2,$3,$4,$5) RETURNING id, path', [title, title, `${dir}/${name}`, kind[1], req.body.in_gallery === 'on']);
  if (wantsJson) return res.json({ id: m.id, url: `/uploads/${m.path}` });
  req.session.flash = 'Gambar diunggah.';
  res.redirect('/admin/media');
}));

router.post('/media/:id(\\d+)/gallery', csrf, h(async (req, res) => {
  await q('UPDATE media SET in_gallery = NOT in_gallery WHERE id=$1', [req.params.id]);
  res.redirect(`/admin/media?halaman=${Number(req.body.halaman) || 1}`);
}));

router.get('/guru', h(async (req, res) => {
  res.render('admin/staff', { rows: await all('SELECT * FROM staff ORDER BY position, id') });
}));

router.post('/guru', csrf, h(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const role = String(req.body.role || '').trim();
  const photo = String(req.body.photo || '').trim();
  const safePhoto = /^\/uploads\/[^\s"'<>]+$/.test(photo) ? photo : '';
  if (!name) { req.session.flash = 'Nama wajib diisi.'; return res.redirect('/admin/guru'); }
  const id = Number(req.body.id);
  try {
    if (id) await q('UPDATE staff SET name=$1, role=$2, photo=COALESCE(NULLIF($3,\'\'), photo), position=$4 WHERE id=$5', [name, role, safePhoto, Number(req.body.position) || 0, id]);
    else await q('INSERT INTO staff (name, role, photo, position) VALUES ($1,$2,$3,(SELECT COALESCE(max(position),0)+1 FROM staff))', [name, role, safePhoto]);
    req.session.flash = 'Data guru tersimpan.';
  } catch (e) {
    if (e.code !== '23505') throw e;
    req.session.flash = 'Nama dan jabatan yang sama sudah ada.';
  }
  res.redirect('/admin/guru');
}));

router.post('/guru/:id(\\d+)/hapus', csrf, h(async (req, res) => {
  await q('DELETE FROM staff WHERE id=$1', [req.params.id]);
  req.session.flash = 'Data guru dihapus.';
  res.redirect('/admin/guru');
}));

router.get('/pengaturan', h(async (req, res) => {
  const rows = await all('SELECT key, value FROM settings');
  res.render('admin/settings', { fields: SETTING_FIELDS, values: Object.fromEntries(rows.map((r) => [r.key, r.value])) });
}));

router.post('/pengaturan', csrf, h(async (req, res) => {
  for (const [key] of SETTING_FIELDS) {
    await q('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [key, String(req.body[key] || '').trim()]);
  }
  req.session.flash = 'Pengaturan tersimpan.';
  res.redirect('/admin/pengaturan');
}));

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    req.session.flash = 'Ukuran gambar maksimal 8 MB.';
    if (req.get('accept')?.includes('json')) return res.status(400).json({ error: req.session.flash });
    return res.redirect('/admin/media');
  }
  return next(err);
});

module.exports = router;
