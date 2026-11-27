import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';

const ARRAYS = new Set(['item', 'wp:postmeta', 'category', 'wp:comment', 'wp:commentmeta', 'wp:category', 'wp:tag', 'wp:term', 'wp:author']);

export type WxrTerm = { domain: string; slug: string; name: string };
export type WxrComment = { id: string; author: string; date: string; content: string; approved: string; parent: string };
export type WxrItem = {
  id: number; type: string; status: string; title: string; slug: string; link: string;
  date: string; localDate: string; modified: string; parent: number; order: number;
  content: string; excerpt: string; attachmentUrl: string;
  meta: [string, string][]; metaMap: Record<string, string>; terms: WxrTerm[]; comments: WxrComment[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;

export function findExport(arg?: string): string {
  if (arg) return path.resolve(arg);
  const root = process.cwd();
  const files = fs.readdirSync(root).filter((f) => /\.WordPress\..*\.xml$/i.test(f)).sort();
  if (!files.length) throw new Error('File export WordPress (.xml) tidak ditemukan.');
  return path.join(root, files.at(-1)!);
}

export const str = (v: Node): string => (v === undefined || v === null ? '' : typeof v === 'object' ? String(v['#text'] ?? '') : String(v)).replace(/\u0000/g, '');
export const sha256 = (s: string) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

export function readExport(file: string): { channel: Node; items: WxrItem[] } {
  const parser = new XMLParser({
    ignoreAttributes: false, attributeNamePrefix: '@_', parseTagValue: false, parseAttributeValue: false,
    trimValues: false, processEntities: false, htmlEntities: false, isArray: (name) => ARRAYS.has(name),
  });
  const channel = parser.parse(fs.readFileSync(file, 'utf8')).rss.channel;
  const items: WxrItem[] = (channel.item || []).map((it: Node) => {
    const meta: [string, string][] = (it['wp:postmeta'] || []).map((m: Node) => [str(m['wp:meta_key']), str(m['wp:meta_value'])]);
    return {
      id: Number(str(it['wp:post_id'])),
      type: str(it['wp:post_type']),
      status: str(it['wp:status']),
      title: str(it.title),
      slug: str(it['wp:post_name']),
      link: str(it.link),
      date: str(it['wp:post_date_gmt']),
      localDate: str(it['wp:post_date']),
      modified: str(it['wp:post_modified_gmt']),
      parent: Number(str(it['wp:post_parent'])) || 0,
      order: Number(str(it['wp:menu_order'])) || 0,
      content: str(it['content:encoded']),
      excerpt: str(it['excerpt:encoded']),
      attachmentUrl: str(it['wp:attachment_url']),
      meta,
      metaMap: Object.fromEntries(meta),
      terms: (it.category || []).map((c: Node) => ({ domain: c['@_domain'], slug: c['@_nicename'], name: str(c) })),
      // Email dan IP pengunjung sengaja tidak disimpan.
      comments: (it['wp:comment'] || []).map((c: Node) => ({
        id: str(c['wp:comment_id']), author: str(c['wp:comment_author']), date: str(c['wp:comment_date']),
        content: str(c['wp:comment_content']), approved: str(c['wp:comment_approved']), parent: str(c['wp:comment_parent']),
      })),
    };
  });
  return { channel, items };
}
