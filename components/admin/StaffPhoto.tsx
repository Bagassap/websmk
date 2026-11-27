'use client';

import { uploadImage } from '@/app/admin/actions';
import { UPLOAD_ERRORS } from '@/lib/flash';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

/** Pilih foto, unggah, isi kolom tersembunyi "photo", lalu kirim formulirnya. */
export default function StaffPhoto({ asLink }: { asLink?: boolean }) {
  const onChange = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    const form = input.form;
    if (!file || !form) return;
    const fd = new FormData();
    fd.append('file', file);
    const r = await uploadImage(fd);
    if ('error' in r) { window.alert(UPLOAD_ERRORS[r.error]); return; }
    (form.elements.namedItem('photo') as HTMLInputElement).value = r.url;
    form.requestSubmit();
  };
  const input = <input type="file" accept={ACCEPT} hidden={asLink} onChange={(e) => onChange(e.currentTarget)} />;
  return asLink ? <label className="linkish">Foto{input}</label> : <label>Foto{input}</label>;
}
