# Website SMK Ma'arif NU 01 Limpung

Satu aplikasi **Next.js 16 + TypeScript** dengan database PostgreSQL. Konten berasal dari export WordPress.

- `app/(site)/`: tampilan publik (beranda, berita, galeri, halaman).
- `app/admin/`: panel admin. Penyimpanan data memakai Server Actions di `app/admin/actions.ts`.
- `components/`: komponen React. Komponen admin ada di `components/admin/`.
- `lib/`: akses database, login admin, pembersih HTML, dan pengolah isi halaman.
- `scripts/`: skrip database dan impor WordPress (dijalankan dengan `tsx`).
- `db/schema.sql`: struktur tabel.

## Menjalankan di komputer ini

```
npm install
npm run db:start
npm run migrate
npm run build
npm start
```

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin
- Login pertama ada di `ADMIN-AWAL.txt`. Password wajib diganti, lalu hapus file itu.
- Mode pengembangan: `npm run dev`
- Cek tipe TypeScript: `npm run typecheck`
- Menghentikan database: `npm run db:stop`

`npm run build` hanya perlu diulang jika kode atau `.env` berubah. Perubahan dari panel admin langsung tampil tanpa build.

## Pemasangan pertama dari nol

`npm run setup` membuat database, tabel, akun admin, lalu mengimpor file XML WordPress yang ada di folder proyek.

## Memasang gambar dari WordPress

1. Unduh `wp-content/uploads` dari File Manager hosting.
2. Salin isinya ke `storage/uploads`, sehingga ada folder seperti `storage/uploads/2026/11`.
3. Jalankan `npm run media:check` sampai hasilnya `Belum ada: 0`.
4. Kosongkan `LEGACY_MEDIA_BASE` di `.env`, lalu jalankan `npm run build` dan mulai ulang.

Jangan matikan WordPress sebelum langkah ini selesai, karena file XML tidak berisi file gambar.

## Perintah data

- `npm run verify`: mencocokkan database dengan file XML.
- `npm run import`: aman diulang dan tidak menimpa konten yang sudah diedit.

## Isi `.env`

- `DATABASE_URL`: alamat PostgreSQL.
- `SITE_URL`: alamat website, misalnya `https://smklimpung.id`.
- `LEGACY_MEDIA_BASE`: sementara gambar diambil dari website lama.

## Saat dipasang di VPS

- Butuh Node.js 20.9 ke atas dan PostgreSQL.
- Pasang dependensi dengan `npm ci`, atur `.env`, lalu `npm run migrate` dan `npm run build`.
- Jalankan `npm start` dengan pengelola proses seperti PM2 atau systemd.
- Pasang Nginx dengan HTTPS di depan port 3000 dan teruskan header `X-Forwarded-Proto` serta `X-Real-IP`. Jangan buka port 5433 ke internet.
- Cadangkan database dengan `pg_dump` dan folder `storage/uploads` secara rutin.
