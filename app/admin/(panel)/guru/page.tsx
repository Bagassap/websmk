import type { Metadata } from 'next';
import { deleteStaff, saveStaff } from '@/app/admin/actions';
import ConfirmButton from '@/components/admin/ConfirmButton';
import StaffPhoto from '@/components/admin/StaffPhoto';
import type { StaffRow } from '@/lib/admin';
import { requireUser } from '@/lib/auth';
import { all } from '@/lib/db';

export const metadata: Metadata = { title: 'Guru & Staff' };

export default async function StaffPage() {
  await requireUser();
  const rows = await all<StaffRow>('SELECT * FROM staff ORDER BY position, id');
  return (
    <>
      <div className="bar"><h1>Guru &amp; Staff ({rows.length})</h1></div>
      <form action={saveStaff} className="panel staff-form">
        <input type="hidden" name="photo" />
        <label>Nama<input name="name" required /></label>
        <label>Jabatan / Mapel<input name="role" /></label>
        <StaffPhoto />
        <button className="btn">Tambah</button>
      </form>
      <div className="table"><table>
        <thead><tr><th>Foto</th><th>Nama</th><th>Jabatan</th><th>Urutan</th><th></th></tr></thead>
        <tbody>
          {rows.map((s) => {
            const f = `s${s.id}`;
            return (
              <tr key={s.id}>
                <td>{s.photo && <img className="avatar" src={s.photo} alt="" />}</td>
                <td><input form={f} name="name" defaultValue={s.name} required aria-label="Nama" /></td>
                <td><input form={f} name="role" defaultValue={s.role} aria-label="Jabatan" /></td>
                <td><input form={f} name="position" type="number" defaultValue={s.position} className="small" aria-label="Urutan" /></td>
                <td className="row-actions">
                  <form id={f} action={saveStaff}>
                    <input type="hidden" name="id" value={s.id} /><input type="hidden" name="photo" />
                    <StaffPhoto asLink />
                    <button className="linkish">Simpan</button>
                  </form>
                  <form action={deleteStaff.bind(null, s.id)}>
                    <ConfirmButton className="linkish danger" message={`Hapus data ${s.name}?`}>Hapus</ConfirmButton>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
    </>
  );
}
