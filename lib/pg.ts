// Koneksi PostgreSQL bersama untuk aplikasi Next.js dan skrip baris perintah.
import fs from 'node:fs';
import path from 'node:path';
import { Pool, type QueryResultRow } from 'pg';

if (!process.env.DATABASE_URL) {
  const envFile = path.join(process.cwd(), '.env');
  if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
}

const globalForPg = globalThis as unknown as { smkPool?: Pool };
export const pool = globalForPg.smkPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
globalForPg.smkPool = pool;

export const q = (text: string, params?: unknown[]) => pool.query(text, params);
export const all = async <T extends QueryResultRow = Record<string, any>>(text: string, params?: unknown[]): Promise<T[]> =>
  (await pool.query<T>(text, params)).rows;
export const one = async <T extends QueryResultRow = Record<string, any>>(text: string, params?: unknown[]): Promise<T | null> =>
  (await pool.query<T>(text, params)).rows[0] ?? null;
