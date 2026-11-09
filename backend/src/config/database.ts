import pg from 'pg';
import { env } from './env';

const { Pool } = pg;

export let pool: pg.Pool | null = null;
export let isDatabaseConnected = false;

if (env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]:', err);
      isDatabaseConnected = false;
    });

    // Test connection
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.warn('[PostgreSQL Connection Notice]: Unable to connect to DATABASE_URL. Running in resilient mock/JSON store mode until connection is active:', err.message);
        isDatabaseConnected = false;
      } else {
        console.log('[PostgreSQL] Connected successfully to persistent database at', res.rows[0].now);
        isDatabaseConnected = true;
      }
    });
  } catch (error) {
    console.warn('[PostgreSQL Init Notice]: Running with in-memory persistence fallback:', error);
    pool = null;
    isDatabaseConnected = false;
  }
} else {
  console.log('[Database] No DATABASE_URL provided. Initialized in resilient local persistence mode.');
}

export const query = async (text: string, params?: any[]) => {
  if (pool && isDatabaseConnected) {
    return pool.query(text, params);
  }
  return null;
};

