// Membaca isi halaman jurusan hasil impor WordPress menjadi data terstruktur.
// Data asli di database tidak diubah, sehingga isi tetap bisa disunting dari admin.
import { decode } from 'he';

export const inline = (html: unknown): string => String(html || '')
  .replace(/<(?!\/?(?:b|strong|em)\b)[^>]*>/gi, ' ')
  .replace(/<(\/?)(b|strong|em)\b[^>]*>/gi, '<$1$2>')
  .replace(/\s+/g, ' ')
  .replace(/\s+([,.:;?!])/g, '$1')
  .trim();
export const plain = (html: unknown): string => decode(inline(html).replace(/<[^>]+>/g, '')).trim();
export const images = (html: unknown): string[] => [...String(html || '').matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]);
export const partnerName = (src: string): string => {
  const base = decodeURIComponent(src.split('/').pop() || '').replace(/-(?:\d+x\d+|scaled).*$|\.[a-z]+$/i, '');
  return base.length <= 4 ? base.toUpperCase() : base[0].toUpperCase() + base.slice(1);
};

export type Partner = { src: string; name: string };
export type ProgramData = NonNullable<ReturnType<typeof parseProgram>>;

export function parseProgram(html: unknown) {
  const source = String(html || '');
  const firstH3 = source.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i);
  const concentrationAt = source.search(/<h3\b[^>]*>\s*Konsentrasi/i);
  if (!firstH3 || concentrationAt < 0) return null;

  const introStart = firstH3.index! + firstH3[0].length;
  const head = source.slice(introStart, concentrationAt);
  const imgAt = head.search(/<img\b/i);
  const intro = inline(imgAt >= 0 ? head.slice(0, imgAt) : head);

  const sidebarAt = source.slice(concentrationAt).search(/<h4\b/i);
  const block = sidebarAt >= 0 ? source.slice(concentrationAt, concentrationAt + sidebarAt) : source.slice(concentrationAt);
  const concentrations = [...block.matchAll(/<a\b[^>]*href="#collapse[^"]*"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => ({ title: plain(m[1]), text: inline(m[2]) }))
    .filter((c) => c.title && c.text);
  if (!intro || !concentrations.length) return null;

  const partnersAt = source.search(/Dipercaya oleh/i);
  const partners = partnersAt >= 0 ? [...new Set(images(source.slice(partnersAt)))].map((src) => ({ src, name: partnerName(src) })) : [];
  const heading = plain(firstH3[1]).replace(/\s*\?*$/, '?');
  const video = (block.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/))([\w-]{11})/i) || [])[1] || null;
  return { heading, intro, image: images(head)[0] || null, concentrations, video, partners };
}
