'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { FLASH } from '@/lib/flash';

/** Menampilkan pesan dari ?pesan=kode, lalu menghapusnya dari alamat agar tidak muncul lagi saat dimuat ulang. */
export default function Flash() {
  const params = useSearchParams();
  const pathname = usePathname();
  const code = params.get('pesan') || '';
  const [shown, setShown] = useState<{ code: string; path: string } | null>(null);

  useEffect(() => {
    if (code) {
      setShown({ code, path: pathname });
      const rest = new URLSearchParams(params.toString());
      rest.delete('pesan');
      const qs = rest.toString();
      window.history.replaceState(window.history.state, '', qs ? `${pathname}?${qs}` : pathname);
    } else if (shown && shown.path !== pathname) {
      setShown(null);
    }
  }, [code, params, pathname, shown]);

  const msg = FLASH[code || (shown?.path === pathname ? shown.code : '')];
  if (!msg) return null;
  return <p className={msg.error ? 'error' : 'flash'} role={msg.error ? 'alert' : 'status'}>{msg.text}</p>;
}
