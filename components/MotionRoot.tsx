'use client';

import { useEffect } from 'react';

// Mesin animasi seluruh halaman: muncul saat digulir, angka berjalan,
// parallax, kartu miring, tombol magnetik, dan indikator gulir.
export default function MotionRoot() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = '1';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const seen = new WeakSet<Element>();
    const fmt = new Intl.NumberFormat('id-ID');

    const runCount = (el: HTMLElement) => {
      const target = Number(el.dataset.count);
      if (reduce || !target) return;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / 1700, 1);
        el.textContent = fmt.format(Math.round(target * (1 - (1 - p) ** 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        if (el.dataset.count) runCount(el);
        else {
          el.classList.add('in');
          setTimeout(() => el.style.setProperty('--d', '0ms'), 1300);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -7% 0px' });

    const scan = () => {
      document.querySelectorAll<HTMLElement>('.prose > *:not([data-reveal])').forEach((el) => { el.dataset.reveal = 'up'; });
      document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((parent) => {
        ([...parent.children] as HTMLElement[]).forEach((child, i) => {
          if (child.dataset.reveal) return;
          child.dataset.reveal = parent.dataset.stagger || 'up';
          child.style.setProperty('--d', `${Math.min(i, 8) * 85}ms`);
        });
      });
      document.querySelectorAll<HTMLElement>('[data-reveal], [data-count]').forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (reduce && el.dataset.reveal) el.classList.add('in');
        else io.observe(el);
      });
    };

    let scanFrame = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(scanFrame);
      scanFrame = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    scan();

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const max = root.scrollHeight - innerHeight;
        root.style.setProperty('--scroll', String(max > 0 ? Math.min(scrollY / max, 1) : 0));
        if (reduce || innerWidth < 860) return;
        document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
          const parent = el.parentElement;
          if (!parent) return;
          const r = parent.getBoundingClientRect();
          if (r.bottom < -80 || r.top > innerHeight + 80) return;
          const offset = (r.top + r.height / 2 - innerHeight / 2) * Number(el.dataset.parallax);
          el.style.translate = `0 ${offset.toFixed(1)}px`;
        });
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();

    const onMove = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const tilt = target?.closest?.<HTMLElement>('[data-tilt]');
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg)`;
      }
      const btn = target?.closest?.<HTMLElement>('.btn');
      if (btn) {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.14).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1)}px)`;
      }
    };
    const onOut = (e: PointerEvent) => {
      ['[data-tilt]', '.btn'].forEach((sel) => {
        const el = (e.target as Element | null)?.closest?.<HTMLElement>(sel);
        if (el && !el.contains(e.relatedTarget as Node | null)) el.style.transform = '';
      });
    };
    if (fine && !reduce) {
      document.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerout', onOut, { passive: true });
    }

    return () => {
      io.disconnect();
      mo.disconnect();
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onOut);
    };
  }, []);

  return <div className="scroll-progress" aria-hidden="true" />;
}
