import type { Metadata } from 'next';
import { PasswordForm } from '@/components/admin/StateForms';
import { requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Ganti Password' };

export default async function PasswordPage() {
  const user = await requireUser({ allowMustChange: true });
  return (
    <>
      <div className="bar"><h1>Ganti Password</h1></div>
      {user.mustChange && <p className="flash">Demi keamanan, ganti password awal sebelum melanjutkan.</p>}
      <PasswordForm />
    </>
  );
}
