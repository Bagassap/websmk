'use client';

import { useActionState } from 'react';
import { changePassword, login, type FormState } from '@/app/admin/actions';

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, null);
  return (
    <form action={action} className="panel">
      <img className="login-logo" src="/logo-smk.png" alt="SMK Ma'arif NU 01 Limpung" width={843} height={174} />
      <div><h1>Masuk Admin</h1><p className="login-sub">Kelola berita, halaman, dan data sekolah.</p></div>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <label>Username<input name="username" autoComplete="username" required autoFocus /></label>
      <label>Password<input type="password" name="password" autoComplete="current-password" required /></label>
      <button className="btn" disabled={pending}>{pending ? 'Memeriksa…' : 'Masuk'}</button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, null);
  return (
    <>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <form action={action} className="panel narrow">
        <label>Password saat ini<input type="password" name="current" autoComplete="current-password" required /></label>
        <label>Password baru (minimal 10 karakter)<input type="password" name="next" minLength={10} autoComplete="new-password" required /></label>
        <label>Ulangi password baru<input type="password" name="confirm" minLength={10} autoComplete="new-password" required /></label>
        <button className="btn" disabled={pending}>Simpan</button>
      </form>
    </>
  );
}
