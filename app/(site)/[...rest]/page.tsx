import { notFound } from 'next/navigation';

// Alamat yang tidak dikenal tetap ditampilkan dengan kepala dan kaki website.
export default function UnknownPage() {
  notFound();
}
