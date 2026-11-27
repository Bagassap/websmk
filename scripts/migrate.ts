import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pool, one, q } from '../lib/pg';
import { hashPassword } from '../lib/password';

(async () => {
  await q(fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8'));
  if (!(await one('SELECT id FROM users LIMIT 1'))) {
    const password = crypto.randomBytes(9).toString('base64url');
    await q('INSERT INTO users (username, name, password_hash) VALUES ($1, $2, $3)', ['admin', 'Administrator', await hashPassword(password)]);
    fs.writeFileSync(path.join(process.cwd(), 'ADMIN-AWAL.txt'),
      `Login admin awal\nAlamat: /admin\nUsername: admin\nPassword: ${password}\n\nPassword wajib diganti saat login pertama. Hapus file ini setelahnya.\n`);
    console.log('Akun admin dibuat. Detail login ada di ADMIN-AWAL.txt.');
  }
  console.log('Struktur database siap.');
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
