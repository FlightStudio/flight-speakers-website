// Idempotent migrations run on Express startup. Add new statements with
// IF NOT EXISTS / ON CONFLICT so re-running is safe.
//
// Cloud SQL doesn't auto-apply init.sql like the local docker-compose does,
// so anything new since the initial schema needs to live here.

import pool from './connection.js'

async function applyMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS revoked_jwts (
      jti TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_revoked_jwts_expires_at ON revoked_jwts(expires_at);
  `)

  // Sweep expired entries on every startup. Cheap because of the index.
  await pool.query(`DELETE FROM revoked_jwts WHERE expires_at < NOW()`)

  await pool.query(`
    ALTER TABLE speakers ADD COLUMN IF NOT EXISTS books JSONB NOT NULL DEFAULT '[]'::jsonb;
  `)
}

// Retry with backoff. Cloud SQL on Cloud Run can take >5s to accept the
// first connection from a new revision; without retries, startup migrations
// fail and admin auth breaks until manual intervention.
export async function runMigrations({ attempts = 5, baseDelayMs = 2000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    try {
      await applyMigrations()
      return
    } catch (err) {
      if (i === attempts - 1) throw err
      const delay = baseDelayMs * Math.pow(2, i)
      console.warn(`[migrations] attempt ${i + 1} failed (${err.message}); retrying in ${delay}ms`)
      await new Promise(r => setTimeout(r, delay))
    }
  }
}
