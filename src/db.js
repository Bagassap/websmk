const path = require('node:path');
const fs = require('node:fs');
const { Pool } = require('pg');

const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
const q = (text, params) => pool.query(text, params);
const one = async (text, params) => (await pool.query(text, params)).rows[0] || null;
const all = async (text, params) => (await pool.query(text, params)).rows;

module.exports = { pool, q, one, all };
