import Link from 'next/link';

export default function Pager({ base, page, pages, query = {} }: { base: string; page: number; pages: number; query?: Record<string, string> }) {
  if (pages <= 1) return null;
  const href = (n: number) => `${base}?${new URLSearchParams({ ...query, halaman: String(n) })}`;
  return (
    <nav className="pager" aria-label="Halaman">
      {page > 1 && <Link href={href(page - 1)}>Sebelumnya</Link>}
      <span>Halaman {page} dari {pages}</span>
      {page < pages && <Link href={href(page + 1)}>Berikutnya</Link>}
    </nav>
  );
}
