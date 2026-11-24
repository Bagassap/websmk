const dateFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

export const fmtDate = (d) => dateFormat.format(new Date(d));
export const isoDate = (d) => new Date(d).toISOString();
export const firstImage = (html) => (String(html || '').match(/<img[^>]+src="([^"]+)"/) || [])[1] || '';
export const waLink = (phone) => `https://wa.me/62${String(phone || '').replace(/\D/g, '').replace(/^0/, '')}`;
export const pageNumber = (v) => Math.max(1, Math.floor(Number(Array.isArray(v) ? v[0] : v)) || 1);
// Link WordPress lama di dalam isi halaman, misalnya href="?page_id=683".
export const fixContentLinks = (html) => String(html || '')
  .replace(/href="\/?\?page_id=2162"/g, 'href="/business-center"')
  .replace(/href="\?/g, 'href="/?');
export const textParam =(v, max = 100) => String((Array.isArray(v) ? v[0] : v) || '').trim().slice(0, max);
