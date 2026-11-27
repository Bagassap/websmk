import Link from 'next/link';

export default function AdminPager({ page, pages, query = {} }: { page: number; pages: number; query?: Record<string, string> }) {
  if (pages <= 1) return null;
  const link = (n: number) => `?${new URLSearchParams({ ...query, halaman: String(n) })}`;
  return (
    <nav className="pager">
      {page > 1 && <Link href={link(page - 1)}>Sebelumnya</Link>}
      <span>{page} / {pages}</span>
      {page < pages && <Link href={link(page + 1)}>Berikutnya</Link>}
    </nav>
  );
}
