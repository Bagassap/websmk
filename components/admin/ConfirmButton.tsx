'use client';

import type { ReactNode } from 'react';

/** Tombol kirim yang meminta konfirmasi lebih dulu. */
export default function ConfirmButton({ message, className, children }: { message: string; className?: string; children: ReactNode }) {
  return (
    <button className={className} onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
