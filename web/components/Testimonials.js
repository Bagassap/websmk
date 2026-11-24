'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Quote, Star } from 'lucide-react';

export default function Testimonials({ items }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = (n) => setActive((n + items.length) % items.length);

  useEffect(() => {
    if (paused || matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setTimeout(() => setActive((a) => (a + 1) % items.length), 6000);
    return () => clearTimeout(t);
  }, [active, paused, items.length]);

  const t = items[active];
  return (
    <div className="testi" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <figure className="testi-card" key={t.name}>
        <Quote className="testi-mark" size={46} aria-hidden="true" />
        <div className="stars" role="img" aria-label="Lima bintang">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={16} fill="currentColor" style={{ '--i': i }} />)}</div>
        <blockquote>{t.text}</blockquote>
        <figcaption><span className="avatar" aria-hidden="true">{t.name.replace(/^(Dr\.\s*)?(H\.\s*)?/, '').charAt(0)}</span><span><strong>{t.name}</strong><small>{t.role}</small></span></figcaption>
      </figure>
      <div className="testi-nav">
        <button type="button" aria-label="Testimoni sebelumnya" onClick={() => go(active - 1)}><ArrowLeft size={18} /></button>
        <span>{active + 1} / {items.length}</span>
        <button type="button" aria-label="Testimoni berikutnya" onClick={() => go(active + 1)}><ArrowRight size={18} /></button>
      </div>
    </div>
  );
}
