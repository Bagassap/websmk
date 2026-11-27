const dateFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

type Param = string | string[] | undefined;
const first = (v: Param) => (Array.isArray(v) ? v[0] : v);

export const fmtDate = (d: Date | string) => dateFormat.format(new Date(d));
export const isoDate = (d: Date | string) => new Date(d).toISOString();
export const firstImage = (html: unknown): string => (String(html || '').match(/<img[^>]+src="([^"]+)"/) || [])[1] || '';
export const waLink = (phone: unknown) => `https://wa.me/62${String(phone || '').replace(/\D/g, '').replace(/^0/, '')}`;
export const pageNumber = (v: Param) => Math.max(1, Math.floor(Number(first(v))) || 1);
// Link WordPress lama di dalam isi halaman, misalnya href="?page_id=683".
export const fixContentLinks = (html: unknown) => String(html || '')
  .replace(/href="\/?\?page_id=2162"/g, 'href="/business-center"')
  .replace(/href="\?/g, 'href="/?');
export const textParam = (v: Param, max = 100) => String(first(v) || '').trim().slice(0, max);

/** Gambar pratinjau share (WhatsApp, Facebook): selalu JPEG 1200x630 dari route /og. */
export const ogImage = (src?: string | null, alt = '') => {
  const m = String(src || '').split(/[?#]/)[0].match(/\/uploads\/(.+\.(?:jpe?g|png|webp|gif))$/i);
  return { url: m ? `/og/${m[1]}` : '/og/default', width: 1200, height: 630, type: 'image/jpeg', alt };
};
