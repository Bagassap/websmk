// Menghitung file media yang sudah ada di storage/uploads.
import fs from 'node:fs';
import path from 'node:path';
import { pool, all } from '../lib/pg';

(async () => {
  const dir = path.join(process.cwd(), 'storage', 'uploads');
  const rows = await all<{ path: string }>('SELECT path FROM media');
  const missing = rows.filter((r) => !fs.existsSync(path.join(dir, r.path)));
  console.log(`Media tersedia: ${rows.length - missing.length}/${rows.length}. Belum ada: ${missing.length}.`);
  missing.slice(0, 20).forEach((m) => console.log(' -', m.path));
  await pool.end();
  process.exit(missing.length ? 2 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
