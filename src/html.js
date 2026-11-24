const sanitizeHtml = require('sanitize-html');
const he = require('he');

// 192.168.20.4 adalah alamat lokal lama yang masih tertinggal di sebagian konten WordPress.
const OLD_HOST = /https?:\/\/(?:smklimpung\.id|192\.168\.20\.4)/g;

function localizeUrls(html) {
  return String(html || '')
    .replace(/https?:\/\/(?:smklimpung\.id|192\.168\.20\.4)\/wp-content\/uploads\//g, '/uploads/')
    .replace(OLD_HOST, '')
    .replace(/(href|src)=""/g, '$1="/"');
}

const OPTIONS = {
  allowedTags: ['p', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li',
    'blockquote', 'br', 'hr', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'iframe'],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    iframe: ['src', 'title', 'allowfullscreen', 'loading'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'www.google.com'],
  transformTags: {
    h1: 'h2',
    a: (tagName, attribs) => {
      const external = /^https?:\/\//.test(attribs.href || '');
      return { tagName, attribs: { ...attribs, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}) } };
    },
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }),
  },
  exclusiveFilter: (f) => ['p', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(f.tag) && !f.text.trim() && !f.mediaChildren?.length,
};

function embedYoutube(html) {
  return html.replace(
    /<p>\s*(?:<a [^>]*>)?\s*https?:\/\/(?:www\.)?(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]{11})[^<\s]*\s*(?:<\/a>)?\s*<\/p>/g,
    (_, id) => `<p><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Video YouTube" loading="lazy" allowfullscreen></iframe></p>`,
  );
}

const cleanHtml = (html) => embedYoutube(sanitizeHtml(localizeUrls(html), OPTIONS)).trim();

function plainText(html) {
  const text = sanitizeHtml(String(html || '').replace(/<\/(p|h\d|li|div)>/g, '$& '), { allowedTags: [], allowedAttributes: {} });
  return he.decode(text).replace(/\s+/g, ' ').trim();
}

function excerpt(html, max = 170) {
  const text = plainText(html);
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

function slugify(s) {
  return he.decode(String(s || '')).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'tanpa-judul';
}

const firstImage = (html) => (String(html || '').match(/<img[^>]+src="([^"]+)"/) || [])[1] || '';

module.exports = { cleanHtml, localizeUrls, plainText, excerpt, slugify, firstImage };
