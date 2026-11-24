const path = require('node:path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const { pool } = require('./db');
const publicRoutes = require('./public');
const adminRoutes = require('./admin');

const app = express();
const prod = process.env.NODE_ENV === 'production';
if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET belum diisi di .env');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.disable('x-powered-by');
// Panel admin hanya menerima koneksi lokal dari Next.js.
app.set('trust proxy', 'loopback');

const legacy = process.env.LEGACY_MEDIA_BASE || '';
const legacyOrigin = legacy ? new URL(legacy).origin : null;
app.use(helmet({
  strictTransportSecurity: prod,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', ...(legacyOrigin ? [legacyOrigin] : [])],
      frameSrc: ['https://www.youtube-nocookie.com', 'https://www.youtube.com', 'https://www.google.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: prod ? [] : null,
    },
  },
}));

app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: prod ? '7d' : 0 }));
const uploads = path.join(__dirname, '..', 'storage', 'uploads');
app.use('/uploads', express.static(uploads, { maxAge: '30d', index: false }));
app.get('/uploads/*', (req, res) => {
  const rel = req.path.replace(/^\/uploads\//, '');
  if (!legacy || rel.includes('..') || rel.includes('\\')) return res.status(404).end();
  res.redirect(302, `${legacy.replace(/\/$/, '')}/${rel}`);
});

app.use(express.urlencoded({ extended: false, limit: '4mb' }));
app.use('/admin', session({
  store: new PgSession({ pool, tableName: 'user_sessions', createTableIfMissing: true }),
  name: 'smk.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto', maxAge: 8 * 3600 * 1000, path: '/admin' },
}));
app.use('/admin', adminRoutes);
// Tampilan publik kini dilayani Next.js. Versi lama hanya aktif jika ADMIN_ONLY=0.
if (process.env.ADMIN_ONLY === '0') app.use(publicRoutes);
else app.use((req, res) => res.status(404).end());

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).type('html').send('<!doctype html><meta charset="utf-8"><title>Terjadi kesalahan</title><p>Terjadi kesalahan. Silakan coba lagi.</p>');
});

const port = Number(process.env.ADMIN_PORT) || 3001;
app.listen(port, '127.0.0.1', () => console.log(`Panel admin berjalan di port ${port}`));
