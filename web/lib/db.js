import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  const envFile = path.join(process.cwd(), '..', '.env');
  if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
}

const pool = globalThis.smkPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
globalThis.smkPool = pool;

export const q = (text, params) => pool.query(text, params);
export const all = async (text, params) => (await pool.query(text, params)).rows;
export const one = async (text, params) => (await pool.query(text, params)).rows[0] ?? null;
