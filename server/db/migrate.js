// Idempotent migrations run on Express startup. Add new statements with
// IF NOT EXISTS / ON CONFLICT so re-running is safe.
//
// Cloud SQL doesn't auto-apply init.sql like the local docker-compose does,
// so anything new since the initial schema needs to live here.

import pool from './connection.js'

export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS revoked_jwts (
      jti TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_revoked_jwts_expires_at ON revoked_jwts(expires_at);
  `)

  // Sweep expired entries on every startup. Cheap because of the index.
  await pool.query(`DELETE FROM revoked_jwts WHERE expires_at < NOW()`)
}
