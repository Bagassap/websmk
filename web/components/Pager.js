import Link from 'next/link';

export default function Pager({ base, page, pages, query = {} }) {
  if (pages <= 1) return null;
  const href = (n) => `${base}?${new URLSearchParams({ ...query, halaman: String(n) })}`;
  return (
    <nav className="pager" aria-label="Halaman">
      {page > 1 && <Link href={href(page - 1)}>Sebelumnya</Link>}
      <span>Halaman {page} dari {pages}</span>
      {page < pages && <Link href={href(page + 1)}>Berikutnya</Link>}
    </nav>
  );
}
