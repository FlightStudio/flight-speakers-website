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

  await pool.query(`
    ALTER TABLE speakers ADD COLUMN IF NOT EXISTS boost_notes TEXT;
  `)

  // Add hero_media_type. Backfill: speakers that already have a videoUrl are
  // most likely showing the video on their hero today (legacy auto behaviour),
  // so flip them to 'video' on first run. Idempotent via the IS NULL guard.
  await pool.query(`
    ALTER TABLE speakers ADD COLUMN IF NOT EXISTS hero_media_type TEXT
      CHECK (hero_media_type IN ('image','video'));
  `)
  await pool.query(`
    UPDATE speakers
    SET hero_media_type = CASE WHEN video_url IS NOT NULL THEN 'video' ELSE 'image' END
    WHERE hero_media_type IS NULL;
  `)
  await pool.query(`
    ALTER TABLE speakers ALTER COLUMN hero_media_type SET NOT NULL;
  `)
  await pool.query(`
    ALTER TABLE speakers ALTER COLUMN hero_media_type SET DEFAULT 'image';
  `)

  // Speaker waitlist table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS speaker_waitlist (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      based_in TEXT NOT NULL,
      title_company TEXT NOT NULL,
      speaks_about TEXT NOT NULL,
      topics TEXT[] NOT NULL DEFAULT '{}',
      speaking_experience TEXT NOT NULL,
      fee_currency TEXT NOT NULL,
      fee_bracket TEXT NOT NULL,
      website TEXT,
      linkedin TEXT,
      showreel TEXT,
      instagram TEXT,
      notable_engagements TEXT,
      representation_status TEXT NOT NULL,
      why_flightspeakers TEXT,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'invited', 'declined')),
      admin_notes TEXT,
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_speaker_waitlist_status ON speaker_waitlist(status);
    CREATE INDEX IF NOT EXISTS idx_speaker_waitlist_created ON speaker_waitlist(created_at DESC);
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
