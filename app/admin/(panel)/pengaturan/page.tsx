import type { Metadata } from 'next';
import { saveSettings } from '@/app/admin/actions';
import { SETTING_FIELDS } from '@/lib/admin';
import { requireUser } from '@/lib/auth';
import { all } from '@/lib/db';

export const metadata: Metadata = { title: 'Pengaturan' };

export default async function SettingsPage() {
  await requireUser();
  const rows = await all<{ key: string; value: string }>('SELECT key, value FROM settings');
  const values = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return (
    <>
      <div className="bar"><h1>Pengaturan Website</h1></div>
      <form action={saveSettings} className="panel narrow">
        {SETTING_FIELDS.map(([k, l]) => (
          <label key={k}>{l}
            {k.endsWith('_text') ? <textarea name={k} rows={3} defaultValue={values[k]} /> : <input name={k} defaultValue={values[k]} />}
          </label>
        ))}
        <button className="btn">Simpan</button>
      </form>
    </>
  );
}
