// Menghitung file media yang sudah ada di storage/uploads.
const fs = require('node:fs');
const path = require('node:path');
const { pool, all } = require('../src/db');

(async () => {
  const dir = path.join(__dirname, '..', 'storage', 'uploads');
  const rows = await all('SELECT path FROM media');
  const missing = rows.filter((r) => !fs.existsSync(path.join(dir, r.path)));
  console.log(`Media tersedia: ${rows.length - missing.length}/${rows.length}. Belum ada: ${missing.length}.`);
  missing.slice(0, 20).forEach((m) => console.log(' -', m.path));
  await pool.end();
  process.exit(missing.length ? 2 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
