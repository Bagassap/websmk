'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ImageGuard() {
  const pathname = usePathname();
  useEffect(() => {
    const onError = (e) => { if (e.target?.tagName === 'IMG') e.target.classList.add('img-missing'); };
    document.addEventListener('error', onError, true);
    document.querySelectorAll('img').forEach((img) => {
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) img.classList.add('img-missing');
    });
    return () => document.removeEventListener('error', onError, true);
  }, [pathname]);
  return null;
}
