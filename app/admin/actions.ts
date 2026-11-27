'use server';

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import sharp from 'sharp';
import { KINDS, SETTING_FIELDS, isStatus, kindOf } from '@/lib/admin';
import { clearFailures, clientIp, createSession, destroySession, dropOtherSessions, isLimited, recordFailure, requireUser } from '@/lib/auth';
import { CACHE_TAG } from '@/lib/data';
import { one, pool, q } from '@/lib/db';
import type { UploadError } from '@/lib/flash';
import { cleanHtml, excerpt, slugify } from '@/lib/html';
import { hashPassword, verifyPassword } from '@/lib/password';

export type FormState = { error?: string } | null;

const UPLOADS = path.join(process.cwd(), 'storage', 'uploads');
const MAX_UPLOAD = 15 * 1024 * 1024;
// Foto dikecilkan sampai sisi terpanjang 1920 px lalu disimpan sebagai WebP.
const MAX_SIDE = 1920;
const WEBP_QUALITY = 80;
const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim();
// Setelah data berubah, cache halaman website dibuang agar perubahan langsung tampil.
const refreshSite = () => updateTag(CACHE_TAG);

/* ---------- Login dan password ---------- */

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (isLimited(ip)) return { error: 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.' };
  const u = await one<{ id: number; password_hash: string; must_change_password: boolean }>(
    'SELECT id, password_hash, must_change_password FROM users WHERE username = $1', [text(fd, 'username')]);
  const ok = await verifyPassword(String(fd.get('password') ?? ''), u?.password_hash || 'scrypt$00$00');
  if (!u || !ok) {
    recordFailure(ip);
    return { error: 'Username atau password salah.' };
  }
  clearFailures(ip);
  await createSession(u.id);
  redirect(u.must_change_password ? '/admin/password' : '/admin');
}

export async function logout() {
  await destroySession();
  redirect('/admin/login');
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser({ allowMustChange: true });
  const current = String(fd.get('current') ?? '');
  const next = String(fd.get('next') ?? '');
  const u = await one<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [user.id]);
  if (!u || !(await verifyPassword(current, u.password_hash))) return { error: 'Password saat ini salah.' };
  if (next.length < 10) return { error: 'Password baru minimal 10 karakter.' };
  if (next !== String(fd.get('confirm') ?? '')) return { error: 'Konfirmasi password tidak sama.' };
  if (next === current) return { error: 'Password baru harus berbeda.' };
  await q('UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2', [await hashPassword(next), user.id]);
  await dropOtherSessions(user.id);
  redirect('/admin?pesan=password');
}

/* ---------- Berita dan halaman ---------- */

async function uniqueSlug(type: string, wanted: string, id: number | null) {
  const base = slugify(wanted);
  for (let n = 1; ; n += 1) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (!(await one('SELECT id FROM contents WHERE type=$1 AND slug=$2 AND id IS DISTINCT FROM $3', [type, slug, id]))) return slug;
  }
}

/** Tanggal dari input datetime-local dibaca sebagai WIB. */
function wibDate(value: string) {
  const d = new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00+07:00` : value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export async function saveContent(kindParam: string, idParam: number | null, _: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const kind = kindOf(kindParam);
  const { type } = KINDS[kind];
  const id = idParam || null;
  const title = text(fd, 'title').slice(0, 300);
  if (!title) return { error: 'Judul wajib diisi.' };
  const html = cleanHtml(fd.get('content_html'));
  const slug = await uniqueSlug(type, text(fd, 'slug') || title, id);
  const status = isStatus(fd.get('status')) ? fd.get('status') : 'draft';
  const values = [title, slug, text(fd, 'excerpt') || excerpt(html), html, status, Number(fd.get('featured_media_id')) || null,
    text(fd, 'seo_title'), text(fd, 'seo_description'), wibDate(text(fd, 'published_at'))];

  const db = await pool.connect();
  let savedId = id;
  try {
    await db.query('BEGIN');
    if (id) {
      const r = await db.query(`UPDATE contents SET title=$1, slug=$2, excerpt=$3, content_html=$4, status=$5, featured_media_id=$6,
        seo_title=$7, seo_description=$8, published_at=$9, updated_at=now() WHERE id=$10 AND type=$11`, [...values, id, type]);
      if (!r.rowCount) throw new Error('Konten tidak ditemukan.');
    } else {
      savedId = (await db.query(`INSERT INTO contents (title, slug, excerpt, content_html, status, featured_media_id, seo_title, seo_description, published_at, type)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, [...values, type])).rows[0].id;
    }
    if (type === 'post') {
      await db.query(`DELETE FROM content_terms WHERE content_id=$1 AND term_id IN (SELECT id FROM terms WHERE taxonomy='category')`, [savedId]);
      for (const c of fd.getAll('categories')) {
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
  refreshSite();
  redirect(`/admin/${kind}/${savedId}?pesan=tersimpan`);
}

export async function trashContent(kindParam: string, id: number) {
  await requireUser();
  const kind = kindOf(kindParam);
  await q(`UPDATE contents SET status='trash', updated_at=now() WHERE id=$1 AND type=$2`, [id, KINDS[kind].type]);
  refreshSite();
  redirect(`/admin/${kind}?pesan=sampah`);
}

/* ---------- Media ---------- */

function imageType(b: Buffer): [string, string] | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ['jpg', 'image/jpeg'];
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ['png', 'image/png'];
  if (b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return ['webp', 'image/webp'];
  if (b.length > 6 && ['GIF87a', 'GIF89a'].includes(b.toString('latin1', 0, 6))) return ['gif', 'image/gif'];
  return null;
}

type Stored = { id: number; url: string } | { error: UploadError };

async function storeImage(file: FormDataEntryValue | null, title: string, inGallery: boolean): Promise<Stored> {
  if (!(file instanceof File) || !file.size) return { error: 'gambar-kosong' };
  if (file.size > MAX_UPLOAD) return { error: 'gambar-besar' };
  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = imageType(buffer);
  if (!kind) return { error: 'gambar-format' };
  // GIF dibiarkan apa adanya agar animasinya tidak hilang.
  let data = buffer;
  let ext = kind[0];
  let mime = kind[1];
  if (ext !== 'gif') {
    try {
      data = await sharp(buffer, { limitInputPixels: 80_000_000 })
        .rotate()
        .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 5 })
        .toBuffer();
      [ext, mime] = ['webp', 'image/webp'];
    } catch {
      return { error: 'gambar-format' };
    }
  }
  const now = new Date();
  const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const original = path.parse(file.name).name;
  const name = `${slugify(original).slice(0, 60)}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  await fs.promises.mkdir(path.join(UPLOADS, dir), { recursive: true });
  await fs.promises.writeFile(path.join(UPLOADS, dir, name), data, { flag: 'wx' });
  const label = (title || original).slice(0, 200);
  const m = await one<{ id: number; path: string }>('INSERT INTO media (title, alt, path, mime, in_gallery) VALUES ($1,$2,$3,$4,$5) RETURNING id, path',
    [label, label, `${dir}/${name}`, mime, inGallery]);
  if (inGallery) refreshSite();
  return { id: m!.id, url: `/uploads/${m!.path}` };
}

/** Dipakai editor dan form guru: mengunggah satu gambar lalu mengembalikan alamatnya. */
export async function uploadImage(fd: FormData): Promise<Stored> {
  await requireUser();
  return storeImage(fd.get('file'), '', false);
}

export async function uploadMedia(fd: FormData) {
  await requireUser();
  const r = await storeImage(fd.get('file'), text(fd, 'title'), fd.get('in_gallery') === 'on');
  redirect(`/admin/media?pesan=${'error' in r ? r.error : 'unggah'}`);
}

export async function toggleGallery(id: number, page: number) {
  await requireUser();
  await q('UPDATE media SET in_gallery = NOT in_gallery WHERE id=$1', [id]);
  refreshSite();
  redirect(`/admin/media?halaman=${page}`);
}

/* ---------- Guru dan staff ---------- */

export async function saveStaff(fd: FormData) {
  await requireUser();
  const name = text(fd, 'name');
  const photo = text(fd, 'photo');
  const safePhoto = /^\/uploads\/[^\s"'<>]+$/.test(photo) ? photo : '';
  if (!name) redirect('/admin/guru?pesan=guru-nama');
  const id = Number(fd.get('id'));
  let pesan = 'guru-simpan';
  try {
    if (id) await q(`UPDATE staff SET name=$1, role=$2, photo=COALESCE(NULLIF($3,''), photo), position=$4 WHERE id=$5`, [name, text(fd, 'role'), safePhoto, Number(fd.get('position')) || 0, id]);
    else await q('INSERT INTO staff (name, role, photo, position) VALUES ($1,$2,$3,(SELECT COALESCE(max(position),0)+1 FROM staff))', [name, text(fd, 'role'), safePhoto]);
    refreshSite();
  } catch (e) {
    if ((e as { code?: string }).code !== '23505') throw e;
    pesan = 'guru-duplikat';
  }
  redirect(`/admin/guru?pesan=${pesan}`);
}

export async function deleteStaff(id: number) {
  await requireUser();
  await q('DELETE FROM staff WHERE id=$1', [id]);
  refreshSite();
  redirect('/admin/guru?pesan=guru-hapus');
}

/* ---------- Pengaturan ---------- */

export async function saveSettings(fd: FormData) {
  await requireUser();
  for (const [key] of SETTING_FIELDS) {
    await q('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [key, text(fd, key)]);
  }
  refreshSite();
  redirect('/admin/pengaturan?pesan=pengaturan');
}
