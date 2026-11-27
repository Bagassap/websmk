import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/StateForms';
import { getUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Masuk' };

export default async function LoginPage() {
  if (await getUser()) redirect('/admin');
  return <main className="login"><LoginForm /></main>;
}
