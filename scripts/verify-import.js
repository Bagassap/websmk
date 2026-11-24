// Mencocokkan isi database dengan file XML, entri demi entri.
const { pool, all } = require('../src/db');
const { findExport, readExport, sha256 } = require('./wxr');

(async () => {
  const { items } = readExport(findExport(process.argv[2]));
  const archive = new Map((await all('SELECT wp_id, post_type, raw_sha256 FROM wp_archive')).map((r) => [Number(r.wp_id), r]));
  const contents = new Set((await all('SELECT wp_id FROM contents WHERE wp_id IS NOT NULL')).map((r) => Number(r.wp_id)));
  const media = new Set((await all('SELECT wp_id FROM media WHERE wp_id IS NOT NULL')).map((r) => Number(r.wp_id)));
  const problems = [];
  const counts = {};
  for (const i of items) {
    counts[i.type] = (counts[i.type] || 0) + 1;
    const a = archive.get(i.id);
    if (!a) problems.push(`Arsip hilang: ${i.type} #${i.id}`);
    else if (a.raw_sha256 !== sha256(i.content)) problems.push(`Isi arsip berbeda: ${i.type} #${i.id}`);
    if ((i.type === 'post' || i.type === 'page') && !contents.has(i.id)) problems.push(`Konten hilang: ${i.type} #${i.id}`);
    if (i.type === 'attachment' && !media.has(i.id)) problems.push(`Media hilang: #${i.id}`);
  }
  const comments = items.reduce((n, i) => n + i.comments.length, 0);
  console.log('Entri XML per jenis:', counts);
  console.log(`Arsip: ${archive.size}/${items.length} | Berita+halaman: ${contents.size}/${(counts.post || 0) + (counts.page || 0)} | Media: ${media.size}/${counts.attachment || 0} | Komentar: ${comments}`);
  await pool.end();
  if (problems.length) {
    console.error(`GAGAL: ${problems.length} masalah`);
    problems.slice(0, 30).forEach((p) => console.error(' -', p));
    process.exit(1);
  }
  console.log('COCOK: semua entri XML tersimpan dan isinya identik.');
})().catch((e) => { console.error(e); process.exit(1); });
