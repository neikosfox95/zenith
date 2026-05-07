// ============================================================
// POSTGRESQL DATABASE CONNECTION - Analytics Database
// ============================================================

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'tiktok_analytics',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ [PostgreSQL] Connected to analytics database');
});

pool.on('error', (err) => {
  console.error('❌ [PostgreSQL] Unexpected error:', err.message);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  console.log('🛑 [PostgreSQL] Pool has ended');
  process.exit(0);
});

// Query helper with error handling
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`[PostgreSQL] Executed query in ${duration}ms`);
    return res;
  } catch (error) {
    console.error('[PostgreSQL] Query error:', error.message);
    throw error;
  }
}

// Transaction helper
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get a client from the pool
export async function getClient() {
  return await pool.connect();
}

// Health check
export async function healthCheck() {
  try {
    const res = await pool.query('SELECT NOW()');
    return {
      status: 'healthy',
      timestamp: res.rows[0].now,
      poolSize: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

export default pool;
