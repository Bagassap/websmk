'use client';

import { useEffect } from 'react';

export default function ViewBeacon({ slug }) {
  useEffect(() => {
    const key = `viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* penyimpanan browser tidak tersedia */ }
    fetch(`/api/views/${encodeURIComponent(slug)}`, { method: 'POST', keepalive: true }).catch(() => {});
  }, [slug]);
  return null;
}
