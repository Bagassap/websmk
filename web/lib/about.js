import { images, inline, partnerName, plain } from './program';

const between = (source, from, to) => {
  const start = source.search(from);
  if (start < 0) return '';
  const rest = source.slice(start);
  const end = to ? rest.slice(1).search(to) : -1;
  return end >= 0 ? rest.slice(0, end + 1) : rest;
};
const paragraphs = (html) => [...String(html || '').matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1]);
const h4 = (html) => (String(html || '').match(/<h4\b[^>]*>([\s\S]*?)<\/h4>/i) || [])[1] || '';
const partnersIn = (html) => [...new Set(images(html))].map((src) => ({ src, name: partnerName(src) }));

export function parseProfile(html) {
  const source = String(html || '');
  const intro = between(source, /Pendidikan yang terjamin/i, /visi dan misi/i);
  const leader = intro.match(/<figure\b[\s\S]*?<\/figure>([\s\S]*?)<p\b[^>]*>([\s\S]*?)<\/p>/i);
  const texts = paragraphs(intro.slice(0, leader?.index ?? intro.length)).map(inline).filter(Boolean);
  const visionPart = between(source, /Visi Sekolah/i, /Misi Sekolah/i);
  const missionPart = between(source, /Misi Sekolah/i, /Dipercaya oleh/i);
  const people = [...between(source, /Struktur Organisasi/i, /Mau tau sejarah/i).matchAll(/<img\b[^>]+src="([^"]+)"[^>]*>([\s\S]*?)<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => ({ photo: m[1], name: plain(m[2]), role: plain(m[3]) }))
    .filter((p) => p.name && p.role);
  if (!texts.length || !leader || !people.length) return null;
  return {
    texts,
    leader: { photo: images(leader[0])[0] || null, name: plain(leader[1]), role: plain(leader[2]) },
    photos: images(intro).slice(1, 3),
    vision: plain(h4(visionPart)),
    missions: h4(missionPart).split(/<br\s*\/?>/i).map((m) => plain(m).replace(/^-\s*/, '')).filter(Boolean),
    partners: partnersIn(between(source, /Dipercaya oleh/i, /Struktur Organisasi/i)),
    people,
  };
}

export function parseHistory(html) {
  const source = String(html || '');
  const h3 = source.match(/<h3\b[^>]*>[\s\S]*?<\/h3>/i);
  if (!h3) return null;
  const rest = source.slice(h3.index + h3[0].length);
  const imgAt = rest.search(/<img\b/i);
  const stop = rest.search(/https?:\/\/(?:www\.)?youtu|<h4\b/i);
  if (imgAt < 0 || stop < imgAt) return null;
  const split = (s) => inline(s).split(/(?=Berawal dari|Dalam perjalanannya|Nama Resmi dalam)/).map((x) => x.trim()).filter(Boolean);
  return {
    image: images(rest)[0],
    before: split(rest.slice(0, imgAt)),
    after: split(rest.slice(imgAt, stop)),
    video: (rest.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]{11})/i) || [])[1] || null,
    partners: partnersIn(between(source, /Dipercaya oleh/i, /Sekolah Kejuruan Unggul/i)),
    milestones: [
      ['15 Mei 2003', 'Rapat para tokoh pendiri sekolah', /15 Mei 2003/],
      ['23 Mei', 'Ditetapkan sebagai Hari Ulang Tahun sekolah', /23 Mei/],
      ['2007', 'Nama menjadi SMK Ma’arif NU 01 Limpung', /Tahun 2007/],
    ].filter(([, , test]) => test.test(source)).map(([date, text]) => ({ date, text })),
  };
}

const ACTIVITY_GROUPS = [
  { id: 'organisasi', title: 'Organisasi dan Pembinaan Siswa', match: /IPNU|Pramuka|Palang Merah|Patroli|Pers|PIK-R|Safety/i },
  { id: 'seni', title: 'Seni dan Budaya', match: /Rebana|Tari|Paduan/i },
  { id: 'olahraga', title: 'Olahraga dan Bela Diri', match: /Pagar Nusa|Karate|Sepak|Futsal|Voli/i },
];

export function parseActivities(html) {
  const source = String(html || '');
  const part = between(source, /<h2\b[^>]*>\s*Intra/i, /Berita dan Artikel/i);
  const items = [...part.matchAll(/<a\b[^>]*href="#collapse[^"]*"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => ({ title: plain(m[1]), text: inline(m[2]) }))
    .filter((x) => x.title && x.text);
  if (!items.length) return null;
  const groups = ACTIVITY_GROUPS.map(({ id, title, match }) => ({ id, title, items: items.filter((x) => match.test(x.title)) }));
  const others = items.filter((x) => !ACTIVITY_GROUPS.some((g) => g.match.test(x.title)));
  if (others.length) groups.push({ id: 'lainnya', title: 'Kegiatan Lainnya', items: others });
  return {
    heading: plain((part.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i) || [])[1]),
    intro: inline(paragraphs(part)[0]),
    total: items.length,
    groups: groups.filter((g) => g.items.length),
  };
}

export function parseContact(html) {
  const source = String(html || '');
  const intro = between(source, /Hubungi Kami/i, /WhatsApp/i);
  const hoursPart = between(source, /Jam Operasional Sekolah/i, /Kami siap melayani/i);
  const hours = paragraphs(hoursPart).map(plain);
  const emails = [...new Set(source.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || [])];
  if (!emails.length || hours.length < 2) return null;
  return { intro: inline(paragraphs(intro)[0]), hoursNote: hours[0], hours: hours[1], emails };
}
