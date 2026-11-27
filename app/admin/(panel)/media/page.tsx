import type { Metadata } from 'next';
import { toggleGallery, uploadMedia } from '@/app/admin/actions';
import AdminPager from '@/components/admin/Pager';
import type { MediaRow } from '@/lib/admin';
import { requireUser } from '@/lib/auth';
import { all, one } from '@/lib/db';
import { pageNumber } from '@/lib/format';

export const metadata: Metadata = { title: 'Media' };
const SIZE = 30;

export default async function MediaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const page = pageNumber((await searchParams).halaman);
  const total = (await one<{ total: number }>(`SELECT count(*)::int AS total FROM media WHERE mime LIKE 'image/%'`))?.total ?? 0;
  const rows = await all<MediaRow>(`SELECT * FROM media WHERE mime LIKE 'image/%' ORDER BY created_at DESC, id DESC LIMIT ${SIZE} OFFSET ${(page - 1) * SIZE}`);
  return (
    <>
      <div className="bar"><h1>Media ({total} gambar)</h1></div>
      <form action={uploadMedia} className="panel upload">
        <label>Gambar (maks. 15 MB, otomatis dikompres ke WebP)<input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif" required /></label>
        <label>Judul<input name="title" /></label>
        <label className="check"><input type="checkbox" name="in_gallery" defaultChecked /> Tampilkan di Galeri</label>
        <button className="btn">Unggah</button>
      </form>
      <div className="media-grid">
        {rows.map((m) => (
          <figure key={m.id}>
            <img src={`/uploads/${m.path}`} alt={m.alt || m.title} loading="lazy" />
            <figcaption>{m.title}</figcaption>
            <form action={toggleGallery.bind(null, m.id, page)}>
              <button className="linkish">{m.in_gallery ? 'Keluarkan dari Galeri' : 'Masukkan ke Galeri'}</button>
            </form>
          </figure>
        ))}
      </div>
      <AdminPager page={page} pages={Math.max(1, Math.ceil(total / SIZE))} />
    </>
  );
}
