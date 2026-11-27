'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, X } from 'lucide-react';

export default function VideoButton({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button className="play" type="button" aria-label={`Putar ${title}`} onClick={() => setOpen(true)}><Play size={28} fill="currentColor" /></button>
      {open && createPortal(
        <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={() => setOpen(false)}>
          <button className="modal-close" type="button" aria-label="Tutup video" autoFocus onClick={() => setOpen(false)}><X size={22} /></button>
          <div className="modal-frame" onClick={(e) => e.stopPropagation()}>
            <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
