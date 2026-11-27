import 'server-only';
import crypto from 'node:crypto';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { one, q } from './db';

const COOKIE = 'smk.sid';
const MAX_AGE = 8 * 3600;
const hash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export type AdminUser = { id: number; name: string; mustChange: boolean };

async function isHttps() {
  return (await headers()).get('x-forwarded-proto') === 'https';
}

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString('base64url');
  await q('DELETE FROM admin_sessions WHERE expires_at < now()');
  await q(`INSERT INTO admin_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(secs => $3))`, [hash(token), userId, MAX_AGE]);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: await isHttps(), path: '/admin', maxAge: MAX_AGE });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await q('DELETE FROM admin_sessions WHERE token_hash = $1', [hash(token)]);
  jar.set(COOKIE, '', { path: '/admin', maxAge: 0 });
}

/** Menghapus sesi lain milik pengguna, misalnya setelah password diganti. */
export async function dropOtherSessions(userId: number) {
  const token = (await cookies()).get(COOKIE)?.value || '';
  await q('DELETE FROM admin_sessions WHERE user_id = $1 AND token_hash <> $2', [userId, hash(token)]);
}

export const getUser = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const u = await one<{ id: number; name: string; must_change_password: boolean }>(
    `SELECT u.id, u.name, u.must_change_password FROM admin_sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`, [hash(token)]);
  return u ? { id: u.id, name: u.name, mustChange: u.must_change_password } : null;
});

/** Wajib login. Selama password awal belum diganti, hanya halaman password yang boleh dibuka. */
export async function requireUser(opts: { allowMustChange?: boolean } = {}): Promise<AdminUser> {
  const user = await getUser();
  if (!user) redirect('/admin/login');
  if (user.mustChange && !opts.allowMustChange) redirect('/admin/password');
  return user;
}

// Pembatas percobaan login per alamat IP.
const WINDOW = 15 * 60 * 1000;
const attempts = ((globalThis as unknown as { smkLoginAttempts?: Map<string, { count: number; at: number }> }).smkLoginAttempts ??= new Map());

export async function clientIp() {
  const h = await headers();
  return h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0].trim() || 'lokal';
}
export function isLimited(ip: string) {
  const a = attempts.get(ip);
  return !!a && Date.now() - a.at <= WINDOW && a.count >= 8;
}
export function recordFailure(ip: string) {
  const a = attempts.get(ip);
  if (!a || Date.now() - a.at > WINDOW) attempts.set(ip, { count: 1, at: Date.now() });
  else a.count += 1;
}
export const clearFailures = (ip: string) => attempts.delete(ip);
