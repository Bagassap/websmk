# Website SMK Ma'arif NU 01 Limpung

- Tampilan publik: Next.js di folder `web/` (port 3000).
- Panel admin: Express di folder `src/` (port 3001, diakses lewat `/admin`).
- Database: PostgreSQL. Konten berasal dari export WordPress.

## Menjalankan di komputer ini

```
npm run db:start
npm run build
npm start
```

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin
- Login pertama ada di `ADMIN-AWAL.txt`. Password wajib diganti, lalu hapus file itu.
- Mode pengembangan: `npm run dev`
- Menghentikan database: `npm run db:stop`

`npm run build` hanya perlu diulang jika kode atau `.env` berubah. Perubahan dari panel admin langsung tampil tanpa build.

## Memasang gambar dari WordPress

1. Unduh `wp-content/uploads` dari File Manager hosting.
2. Salin isinya ke `storage/uploads`, sehingga ada folder seperti `storage/uploads/2026/11`.
3. Jalankan `npm run media:check` sampai hasilnya `Belum ada: 0`.
4. Kosongkan `LEGACY_MEDIA_BASE` di `.env`, lalu jalankan `npm run build` dan mulai ulang.

Jangan matikan WordPress sebelum langkah ini selesai, karena file XML tidak berisi file gambar.

## Perintah data

- `npm run verify`: mencocokkan database dengan file XML.
- `npm run import`: aman diulang dan tidak menimpa konten yang sudah diedit.

## Saat dipasang di VPS

- Butuh Node.js 20.9 ke atas dan PostgreSQL.
- Pasang dependensi di root dan `web/` dengan `npm ci`.
- Atur `SITE_URL=https://smklimpung.id`, `DATABASE_URL`, `SESSION_SECRET`, dan `REVALIDATE_SECRET` baru di `.env`, lalu `npm run build`.
- Jalankan `npm start` dengan pengelola proses seperti PM2 atau systemd.
- Pasang Nginx dengan HTTPS di depan port 3000. Jangan buka port 3001 dan 5433 ke internet.
- Cadangkan database dengan `pg_dump` dan folder `storage/uploads` secara rutin.
