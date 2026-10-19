/* ============================================================================
   Type Station - Database Connection Pool (PostgreSQL via pg)
   A Product of PluralTech LTD
   ============================================================================ */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Minimal zero-dependency .env parser fallback if not already loaded in process.env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const { Pool } = pg;

const poolConfig = {
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '2208Birth#@',
  database: process.env.PGDATABASE || 'typestation',
  port: parseInt(process.env.PGPORT || '5432', 10),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000
};

export const pool = new Pool(poolConfig);

// Keep track of connection health
let dbConnected = false;

pool.on('error', (err) => {
  console.warn('[PostgreSQL Pool Warning]', err.message);
});

/**
 * Execute a parameterized query with graceful error handling.
 * Returns { rows: [], error: null } on success, or { rows: [], error } if failed.
 */
export async function query(text, params = []) {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      // debug logging
    }
    dbConnected = true;
    return { rows: res.rows, rowCount: res.rowCount, error: null };
  } catch (err) {
    if (!dbConnected) {
      console.warn(`[Type Station DB] PostgreSQL connection note: ${err.message}. (Database operations will fallback gracefully).`);
    }
    return { rows: [], rowCount: 0, error: err };
  }
}

/**
 * Check database connection status
 */
export async function checkConnection() {
  try {
    const res = await pool.query('SELECT 1 AS alive');
    dbConnected = true;
    return true;
  } catch (e) {
    dbConnected = false;
    return false;
  }
}

export default {
  pool,
  query,
  checkConnection
};
