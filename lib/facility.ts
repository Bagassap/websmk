import { images, inline, plain } from './program';
import { FACILITY_PHOTOS } from './school';

// Tautan "Cek Lebih Detail" di WordPress memakai ID halaman lama.
const PAGE_BY_WP_ID: Record<string, string> = {
  683: 'nusa-sport-center',
  685: 'pelayanan-publik',
  2162: 'business-center',
  687: 'asrama',
  689: 'masjid',
  691: 'laboratorium-akl',
  693: 'laboratorium-pm',
  695: 'laboratorium-to',
  697: 'laboratorium-pplg',
};
export const FACILITY_SLUGS = new Set(Object.values(PAGE_BY_WP_ID));

const firstTag = (html: unknown, tag: string): string => (String(html || '').match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i')) || [])[1] || '';

// Daftar berkoma dari WordPress. Koma sebelum huruf kecil masih satu butir,
// dan rincian setelah titik dua digabung sampai kata "dll".
function splitItems(text: string): string[] {
  const items: string[] = [];
  let open = false;
  for (const part of text.split(/,\s+(?=\p{Lu})/u)) {
    if (open) items[items.length - 1] += `, ${part}`;
    else items.push(part);
    const current = items[items.length - 1];
    open = /:\s/.test(current) && !/\bdll\b/i.test(current);
  }
  return items.map((s) => s.replace(/[\s.]+$/, '').trim()).filter(Boolean);
}

export type FacilityIndexData = NonNullable<ReturnType<typeof parseFacilityIndex>>;
export type FacilityData = { title: string; heading: string; intro: string; image: string | null; listTitle?: string; lead?: string; items: string[]; note?: string; closing?: string; video?: string | null };

export function parseFacilityIndex(html: unknown) {
  const source = String(html || '');
  const start = source.search(/Rasakan Pengalaman/i);
  const whyAt = source.search(/Kenapa harus/i);
  if (start < 0 || whyAt < start) return null;

  const cardsHtml = source.slice(start, whyAt);
  const cards = [...cardsHtml.matchAll(/<img\b[^>]+src="([^"]+)"[^>]*>([\s\S]*?)<p\b[^>]*>([\s\S]*?)<\/p>[\s\S]*?<a\b[^>]*href="[^"]*page_id=(\d+)"/gi)]
    .map((m) => ({ image: FACILITY_PHOTOS[PAGE_BY_WP_ID[m[4]]] || m[1], title: plain(m[2].replace(/<ul\b[\s\S]*?<\/ul>/gi, '')), text: inline(m[3]), slug: PAGE_BY_WP_ID[m[4]] }))
    .filter((c) => c.title && c.slug);
  if (!cards.length) return null;

  const tail = source.slice(whyAt);
  const endAt = tail.search(/kreatif\s*-\s*religius/i);
  const why = endAt >= 0 ? tail.slice(0, endAt) : tail;
  const whyHeadingEnd = why.search(/<\/h2>/i);
  const afterHeading = whyHeadingEnd >= 0 ? why.slice(whyHeadingEnd + 5) : '';
  const textMatch = afterHeading.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  const rest = textMatch ? afterHeading.slice(textMatch.index! + textMatch[0].length) : '';
  const highlights = [...rest.replace(/<\/?(?:div|span|section)\b[^>]*>/gi, ' ').matchAll(/([^<>]+?)\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => ({ title: plain(m[1]), text: plain(m[2]) }))
    .filter((h) => h.title && h.text);

  return {
    heading: plain(firstTag(source.slice(start - 200 < 0 ? 0 : source.lastIndexOf('<h2', start)), 'h2')),
    subtitle: plain(firstTag(source, 'h4')),
    cards,
    why: {
      kicker: plain(why.split(/<\/h6>/i)[0]),
      heading: plain(firstTag(why, 'h2')),
      text: inline(textMatch?.[1]),
      image: images(why)[0] || null,
      highlights,
    },
  };
}

export function parseFacility(html: unknown): FacilityData | null {
  const source = String(html || '');
  const h3 = source.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i);
  if (!h3) return null;
  const introStart = h3.index! + h3[0].length;
  const rest = source.slice(introStart);
  const accordion = rest.match(/<a\b[^>]*href="#collapse[^"]*"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (!accordion) return null;

  const head = rest.slice(0, accordion.index!);
  const imgAt = head.search(/<img\b/i);
  const intro = inline(imgAt >= 0 ? head.slice(0, imgAt) : head);
  if (!intro) return null;

  const body = accordion[2];
  const list = body.match(/(:|\byaitu\b)\s*<strong\b[^>]*>([\s\S]*?)<\/strong>/i);
  const after = rest.slice(accordion.index! + accordion[0].length);
  const stop = after.search(/https?:\/\/(?:www\.)?youtu|<h4\b/i);
  const closingHtml = stop >= 0 ? after.slice(0, stop) : after;

  return {
    title: plain(firstTag(source, 'h2')),
    heading: plain(h3[1]),
    intro,
    image: images(head)[0] || null,
    listTitle: plain(accordion[1]),
    lead: inline(list ? body.slice(0, list.index! + list[1].length) : body),
    items: list ? splitItems(plain(list[2])) : [],
    note: list ? inline(body.slice(list.index! + list[0].length)) : '',
    closing: inline(closingHtml),
    video: (after.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]{11})/i) || [])[1] || null,
  };
}
