'use client';

import { useState } from 'react';
import { Check, Link2, MessageCircle, Share2 } from 'lucide-react';
import { SocialIcon } from './Icon';

/** Tombol bagikan berita. Gambar pratinjau di WhatsApp berasal dari tag og:image halaman. */
export default function ShareButtons({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => new URL(path, window.location.origin).toString();
  const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer');

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
    } catch {
      window.prompt('Salin link berita ini:', url());
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    if (navigator.share) {
      try { await navigator.share({ title, url: url() }); } catch { /* dibatalkan */ }
    } else copy();
  }

  return (
    <div className="share" aria-label="Bagikan berita">
      <span className="share-label"><Share2 size={18} aria-hidden="true" />Bagikan</span>
      <button type="button" className="share-wa" onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${url()}`)}`)}>
        <MessageCircle size={18} aria-hidden="true" />WhatsApp
      </button>
      <button type="button" className="share-fb" onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)}>
        <SocialIcon name="facebook" />Facebook
      </button>
      <button type="button" onClick={copy}>
        {copied ? <Check size={18} aria-hidden="true" /> : <Link2 size={18} aria-hidden="true" />}{copied ? 'Link disalin' : 'Salin link'}
      </button>
      <button type="button" className="share-more" onClick={nativeShare} aria-label="Bagikan lewat aplikasi lain"><Share2 size={18} aria-hidden="true" /></button>
    </div>
  );
}
