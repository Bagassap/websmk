import { Suspense, type ReactNode } from 'react';
import AdminNav from '@/components/admin/AdminNav';
import Flash from '@/components/admin/Flash';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireUser({ allowMustChange: true });
  return (
    <div className="layout">
      <AdminNav />
      <main className="main">
        <Suspense><Flash /></Suspense>
        {children}
      </main>
    </div>
  );
}
