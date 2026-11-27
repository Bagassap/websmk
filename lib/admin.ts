import 'server-only';
import { notFound } from 'next/navigation';

export const KINDS = {
  berita: { type: 'post', label: 'Berita' },
  halaman: { type: 'page', label: 'Halaman' },
} as const;
export type Kind = keyof typeof KINDS;
export type ContentType = (typeof KINDS)[Kind]['type'];
export type Status = 'publish' | 'draft' | 'trash';

export const STATUSES: [Status, string][] = [['publish', 'Tayang'], ['draft', 'Draf'], ['trash', 'Sampah']];
export const STATUS_NAME: Record<string, string> = Object.fromEntries(STATUSES);
export const isStatus = (v: unknown): v is Status => STATUSES.some(([s]) => s === v);

export function kindOf(value: string): Kind {
  if (value !== 'berita' && value !== 'halaman') notFound();
  return value;
}

export const SETTING_FIELDS: [string, string][] = [
  ['site_name', 'Nama sekolah'], ['tagline', 'Slogan'], ['hero_title', 'Judul beranda'], ['hero_text', 'Teks beranda'],
  ['about_text', 'Teks tentang sekolah'], ['address', 'Alamat'], ['whatsapp', 'WhatsApp'], ['email', 'Email utama'],
  ['email_2', 'Email kedua'], ['hours', 'Jam operasional'], ['spmb_url', 'Link pendaftaran SPMB'],
];

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' });
export const fmt = (d: Date | string) => dateFormat.format(new Date(d));
export const num = (n: unknown) => Number(n || 0).toLocaleString('id-ID');

/** Nilai untuk input datetime-local dalam waktu WIB. */
export const toWibInput = (d: Date | string) => new Date(new Date(d).getTime() + 7 * 3600000).toISOString().slice(0, 16);

export type ContentRow = {
  id: number; title: string; slug: string; excerpt: string; content_html: string; status: Status;
  featured_media_id: number | null; seo_title: string; seo_description: string; published_at: Date; updated_at: Date;
  views: number; image: string | null;
};
export type MediaRow = { id: number; title: string; alt: string; path: string; mime: string; in_gallery: boolean; created_at: Date };
export type StaffRow = { id: number; name: string; role: string; photo: string; position: number };
