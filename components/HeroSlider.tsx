'use client';

import { Fragment, useCallback, useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export type Slide = { eyebrow: string; title: string; accent?: string; text: string; media: ReactNode; actions: ReactNode };

function Words({ text, accent }: { text: string; accent?: string }) {
  const words = text.split(' ');
  const accentWords = new Set((accent || '').split(' '));
  return (
    <span aria-hidden="true">
      {words.map((w, i) => (
        <Fragment key={`${w}-${i}`}>
          <span className="word"><span className={accentWords.has(w) ? 'accent' : ''} style={{ '--i': i }}>{w}</span></span>{' '}
        </Fragment>
      ))}
    </span>
  );
}

export default function HeroSlider({ slides, students }: { slides: Slide[]; students?: ReactNode }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const go = useCallback((n: number) => setActive((n + count) % count), [count]);

  useEffect(() => {
    if (paused || matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setTimeout(() => go(active + 1), 6500);
    return () => clearTimeout(t);
  }, [active, paused, go]);

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Sorotan sekolah"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {slides.map((s, i) => {
        const Title = i === 0 ? 'h1' : 'h2';
        return (
          <div className={`slide${i === active ? ' active' : ''}`} key={s.title} aria-hidden={i !== active} inert={i !== active}>
            <div className="slide-media">{s.media}</div>
            <div className="slide-shade" />
            <div className="wrap slide-body">
              <p className="kicker kicker-light"><span />{s.eyebrow}</p>
              <Title aria-label={s.title}><Words text={s.title} accent={s.accent} /></Title>
              <p className="slide-text">{s.text}</p>
              <div className="actions">{s.actions}</div>
            </div>
          </div>
        );
      })}
      {students}
      <button className="hero-arrow prev" type="button" aria-label="Slide sebelumnya" onClick={() => go(active - 1)}><ArrowLeft size={20} /></button>
      <button className="hero-arrow next" type="button" aria-label="Slide berikutnya" onClick={() => go(active + 1)}><ArrowRight size={20} /></button>
      <div className="hero-dots">
        {slides.map((s, i) => (
          <button type="button" key={s.title} className={i === active ? 'on' : ''} aria-label={`Slide ${i + 1}`} aria-current={i === active} onClick={() => go(i)}>
            {i === active && !paused && <i />}
          </button>
        ))}
      </div>
    </section>
  );
}
