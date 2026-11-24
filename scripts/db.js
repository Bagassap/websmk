// Mengelola database PostgreSQL khusus proyek ini di data/postgres (port 5433).
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data', 'postgres');
const logFile = path.join(root, 'data', 'postgres.log');
const envFile = path.join(root, '.env');
const PORT = 5433;
const DB_USER = 'smk';
const DB_NAME = 'smk_limpung';

if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

function pgBin() {
  const candidates = [process.env.PG_BIN, 'C:\\Program Files\\PostgreSQL\\16\\bin', 'C:\\laragon\\bin\\postgresql\\postgresql-14.5-1\\bin'].filter(Boolean);
  const found = candidates.find((d) => fs.existsSync(path.join(d, process.platform === 'win32' ? 'initdb.exe' : 'initdb')));
  if (!found) throw new Error('PostgreSQL tidak ditemukan. Isi PG_BIN di .env dengan folder bin PostgreSQL.');
  return found;
}

function run(tool, args) {
  const r = spawnSync(path.join(pgBin(), tool), args, { stdio: 'ignore', windowsHide: true, timeout: 120000 });
  if (r.error) throw r.error;
  return r.status;
}

const isRunning = () => fs.existsSync(path.join(dataDir, 'PG_VERSION')) && run('pg_ctl', ['status', '-D', dataDir]) === 0;

function start() {
  if (isRunning()) return console.log('Database sudah berjalan.');
  if (run('pg_ctl', ['start', '-w', '-D', dataDir, '-l', logFile]) !== 0) throw new Error(`Database gagal dijalankan. Lihat ${logFile}`);
  console.log(`Database berjalan di 127.0.0.1:${PORT}.`);
}

function stop() {
  if (!isRunning()) return console.log('Database tidak sedang berjalan.');
  run('pg_ctl', ['stop', '-m', 'fast', '-w', '-D', dataDir]);
  console.log('Database dihentikan.');
}

async function init() {
  fs.mkdirSync(path.dirname(dataDir), { recursive: true });
  if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    if (fs.existsSync(envFile)) throw new Error('.env sudah ada tetapi data database tidak ditemukan. Periksa sebelum melanjutkan.');
    const password = crypto.randomBytes(24).toString('hex');
    const pwFile = path.join(os.tmpdir(), `smk-pg-${crypto.randomUUID()}`);
    fs.writeFileSync(pwFile, password, { mode: 0o600 });
    try {
      const code = run('initdb', ['-D', dataDir, '-U', DB_USER, `--pwfile=${pwFile}`, '--auth=scram-sha-256', '--encoding=UTF8', '--locale=C']);
      if (code !== 0) throw new Error('initdb gagal.');
    } finally {
      fs.rmSync(pwFile, { force: true });
    }
    fs.appendFileSync(path.join(dataDir, 'postgresql.conf'), `\nport = ${PORT}\nlisten_addresses = '127.0.0.1'\n`);
    fs.writeFileSync(envFile, [
      'NODE_ENV=development',
      'PORT=3000',
      `DATABASE_URL=postgres://${DB_USER}:${password}@127.0.0.1:${PORT}/${DB_NAME}`,
      `SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}`,
      'SITE_URL=http://localhost:3000',
      '# Gambar yang belum ada di storage/uploads diambil browser dari website lama.',
      '# Kosongkan setelah uploads.zip dipasang.',
      'LEGACY_MEDIA_BASE=https://smklimpung.id/wp-content/uploads',
      '',
    ].join('\n'));
    process.env.DATABASE_URL = `postgres://${DB_USER}:${password}@127.0.0.1:${PORT}/${DB_NAME}`;
  }
  start();
  const { Client } = require('pg');
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = '/postgres';
  const c = new Client({ connectionString: url.toString() });
  await c.connect();
  const exists = await c.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
  if (!exists.rowCount) await c.query(`CREATE DATABASE ${DB_NAME} ENCODING 'UTF8' TEMPLATE template0`);
  await c.end();
  console.log(`Database ${DB_NAME} siap.`);
}

const cmd = process.argv[2];
Promise.resolve().then(() => ({ init, start, stop })[cmd]?.() ?? console.log('Pakai: node scripts/db.js init|start|stop'))
  .catch((e) => { console.error(e.message); process.exit(1); });
