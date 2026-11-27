import type { Metadata } from 'next';
import Link from 'next/link';
import { trashContent } from '@/app/admin/actions';
import ConfirmButton from '@/components/admin/ConfirmButton';
import AdminPager from '@/components/admin/Pager';
import { KINDS, STATUSES, STATUS_NAME, fmt, isStatus, kindOf, type Status } from '@/lib/admin';
import { requireUser } from '@/lib/auth';
import { all, one } from '@/lib/db';
import { pageNumber, textParam } from '@/lib/format';

type Props = { params: Promise<{ kind: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const SIZE = 20;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: KINDS[kindOf((await params).kind)].label };
}

export default async function ContentListPage({ params, searchParams }: Props) {
  await requireUser();
  const kind = kindOf((await params).kind);
  const { type, label } = KINDS[kind];
  const sp = await searchParams;
  const page = pageNumber(sp.halaman);
  const search = textParam(sp.q);
  const rawStatus = textParam(sp.status);
  const status: Status | '' = isStatus(rawStatus) ? rawStatus : '';

  const values: unknown[] = [type];
  let where = 'type = $1';
  if (status) { values.push(status); where += ` AND status = $${values.length}`; } else where += " AND status <> 'trash'";
  if (search) { values.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`); where += ` AND title ILIKE $${values.length}`; }
  const total = (await one<{ total: number }>(`SELECT count(*)::int AS total FROM contents WHERE ${where}`, values))?.total ?? 0;
  const rows = await all<{ id: number; title: string; status: Status; published_at: Date; views: number }>(
    `SELECT id, title, status, published_at, views FROM contents WHERE ${where} ORDER BY published_at DESC LIMIT ${SIZE} OFFSET ${(page - 1) * SIZE}`, values);

  return (
    <>
      <div className="bar"><h1>{label} ({total})</h1><Link className="btn" href={`/admin/${kind}/baru`}>Tambah {label}</Link></div>
      <form className="filters">
        <input name="q" defaultValue={search} placeholder="Cari judul..." aria-label="Cari judul" />
        <select name="status" aria-label="Status" defaultValue={status}>
          <option value="">Semua</option>
          {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="btn soft">Terapkan</button>
      </form>
      <div className="table"><table>
        <thead><tr><th>Judul</th><th>Status</th><th>Tanggal</th><th>Dibaca</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/admin/${kind}/${r.id}`}>{r.title}</Link></td>
              <td><span className={`tag ${r.status}`}>{STATUS_NAME[r.status] || r.status}</span></td>
              <td>{fmt(r.published_at)}</td>
              <td>{r.views}</td>
              <td>{r.status !== 'trash' && (
                <form action={trashContent.bind(null, kind, r.id)}>
                  <ConfirmButton className="linkish danger" message="Pindahkan ke Sampah?">Sampah</ConfirmButton>
                </form>
              )}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <AdminPager page={page} pages={Math.max(1, Math.ceil(total / SIZE))} query={{ ...(search ? { q: search } : {}), ...(status ? { status } : {}) }} />
    </>
  );
}
