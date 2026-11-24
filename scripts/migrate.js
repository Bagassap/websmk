const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pool, one, q } = require('../src/db');
const { hashPassword } = require('../src/password');

(async () => {
  await q(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
  if (!(await one('SELECT id FROM users LIMIT 1'))) {
    const password = crypto.randomBytes(9).toString('base64url');
    await q('INSERT INTO users (username, name, password_hash) VALUES ($1, $2, $3)', ['admin', 'Administrator', await hashPassword(password)]);
    fs.writeFileSync(path.join(__dirname, '..', 'ADMIN-AWAL.txt'),
      `Login admin awal\nAlamat: /admin\nUsername: admin\nPassword: ${password}\n\nPassword wajib diganti saat login pertama. Hapus file ini setelahnya.\n`);
    console.log('Akun admin dibuat. Detail login ada di ADMIN-AWAL.txt.');
  }
  console.log('Struktur database siap.');
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
