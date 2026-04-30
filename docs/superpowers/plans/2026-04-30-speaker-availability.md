# Speaker Availability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the faked PRNG-based availability in `AvailabilityCalendar.jsx` with real data sourced from speakers via a long-lived magic-link self-service page, plus an admin-side link generator and a public read endpoint that the enquiry-form calendar consumes.

**Architecture:** New `speaker_blocked_dates` table (one row per blocked day). Extend `speaker_tokens` with an `'availability'` type and `revoked_at` column for rotation. Tokens travel in POST request bodies (not URLs) to mirror the existing portal pattern. New `/speaker-availability#<token>` page lets the speaker toggle future days; `/api/speakers/:id/availability` is a public read for the enquiry form; admin gets get-or-create + rotate buttons on the speaker detail page.

**Tech Stack:** Express 5 + Postgres (pgvector), zod, vitest, React Router v6, Framer Motion. Migrations live in `server/db/migrate.js` (idempotent, runs on boot).

**Spec:** `docs/superpowers/specs/2026-04-30-speaker-availability-design.md`

---

## File Structure

**Created:**
- `server/db/availability-queries.js` — DB helpers: `getBlockedDates(speakerId, from, to)`, `replaceFutureBlockedDates(speakerId, dates)`.
- `server/schemas/availability.js` — Zod schemas for the save payload.
- `server/routes/availability.js` — Public token-protected `POST /validate` and `POST /save`.
- `server/schemas/availability.test.js` — Vitest unit tests for the schema.
- `src/pages/SpeakerAvailabilityPage.jsx` — Speaker self-service UI.
- `src/pages/SpeakerAvailabilityPage.css` — Page styles.
- `src/components/forms/useSpeakerAvailability.js` — Frontend hook for fetching blocked dates.

**Modified:**
- `server/db/migrate.js` — Append migration block for `speaker_blocked_dates`, token CHECK constraint, `revoked_at` column.
- `server/db/token-queries.js` — Extend `validateToken` to handle `'availability'` type. Add `getActiveAvailabilityToken(speakerId)` and `revokeToken(token)`.
- `server/schemas/index.js` — Re-export `availabilitySaveSchema`.
- `server/routes/speakers.js` — Add `GET /:id/availability?from=&to=` public read.
- `server/routes/admin/speakers.js` — Add `GET /:id/availability-link` (get-or-create) and `POST /:id/availability-link/rotate`.
- `server/index.js` — Mount `/api/availability` under `portalLimiter`.
- `src/App.jsx` — Add `/speaker-availability` route.
- `src/components/forms/AvailabilityCalendar.jsx` — Replace `generateAvailability()` with the new hook; drop "limited" state.
- `src/admin/pages/AdminSpeakerDetailPage.jsx` — Add "Availability link" panel with copy + rotate buttons.

---

## Task 1: Schema migration

**Files:**
- Modify: `server/db/migrate.js` (append at end of `applyMigrations`)

- [ ] **Step 1: Add migration block**

Append before the closing `}` of `applyMigrations()`:

```js
  // Speaker self-service availability — one row per blocked day.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS speaker_blocked_dates (
      speaker_id TEXT NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
      blocked_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (speaker_id, blocked_date)
    );
    CREATE INDEX IF NOT EXISTS idx_speaker_blocked_dates_speaker
      ON speaker_blocked_dates(speaker_id);
    CREATE INDEX IF NOT EXISTS idx_speaker_blocked_dates_date
      ON speaker_blocked_dates(blocked_date);
  `)

  // Add 'availability' to speaker_tokens.type CHECK and a revoked_at column
  // so we can rotate long-lived availability tokens without deleting them.
  await pool.query(`
    ALTER TABLE speaker_tokens DROP CONSTRAINT IF EXISTS speaker_tokens_type_check;
    ALTER TABLE speaker_tokens ADD CONSTRAINT speaker_tokens_type_check
      CHECK (type IN ('new', 'update', 'availability'));
    ALTER TABLE speaker_tokens ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
  `)
```

- [ ] **Step 2: Apply by restarting the server**

Run: `npm run db:start` (idempotent), then `npm run server`. Watch for `Migrations applied`. If running, restart it.

- [ ] **Step 3: Verify in Postgres**

Run:
```bash
docker exec flight-speakers-db psql -U postgres -d flight_speakers -c "\d speaker_blocked_dates"
docker exec flight-speakers-db psql -U postgres -d flight_speakers -c "\d speaker_tokens"
```

Expected: `speaker_blocked_dates` table exists with `(speaker_id, blocked_date)` PK; `speaker_tokens` has `revoked_at` column and the CHECK includes `'availability'`.

- [ ] **Step 4: Commit**

```bash
git add server/db/migrate.js
git commit -m "db: add speaker_blocked_dates and availability token type"
```

---

## Task 2: Zod schema for save payload (TDD)

**Files:**
- Create: `server/schemas/availability.js`
- Create: `server/schemas/availability.test.js`
- Modify: `server/schemas/index.js`

- [ ] **Step 1: Write the failing test**

Create `server/schemas/availability.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { availabilitySaveSchema } from './availability.js'

describe('availabilitySaveSchema', () => {
  it('accepts an empty blocked array', () => {
    const r = availabilitySaveSchema.safeParse({ blocked: [] })
    expect(r.success).toBe(true)
  })

  it('accepts well-formed YYYY-MM-DD dates', () => {
    const r = availabilitySaveSchema.safeParse({
      blocked: ['2030-01-01', '2030-12-31'],
    })
    expect(r.success).toBe(true)
  })

  it('rejects malformed dates', () => {
    const r = availabilitySaveSchema.safeParse({ blocked: ['2030/01/01'] })
    expect(r.success).toBe(false)
  })

  it('rejects more than 366 entries', () => {
    const dates = Array.from({ length: 367 }, (_, i) => {
      const d = new Date(2030, 0, 1 + i).toISOString().slice(0, 10)
      return d
    })
    const r = availabilitySaveSchema.safeParse({ blocked: dates })
    expect(r.success).toBe(false)
  })

  it('rejects non-string entries', () => {
    const r = availabilitySaveSchema.safeParse({ blocked: [123] })
    expect(r.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- server/schemas/availability.test.js`
Expected: FAIL with "Cannot find module './availability.js'".

- [ ] **Step 3: Implement schema**

Create `server/schemas/availability.js`:

```js
import { z } from 'zod'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const availabilitySaveSchema = z.object({
  blocked: z.array(z.string().regex(ISO_DATE, 'Date must be YYYY-MM-DD'))
    .max(366, 'Cannot block more than 366 dates at once'),
})
```

- [ ] **Step 4: Re-export from index**

Edit `server/schemas/index.js` — append:

```js
export { availabilitySaveSchema } from './availability.js'
```

- [ ] **Step 5: Run tests**

Run: `npm test -- server/schemas/availability.test.js`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add server/schemas/availability.js server/schemas/availability.test.js server/schemas/index.js
git commit -m "schemas: add availability save schema with zod validation"
```

---

## Task 3: Token query helpers

**Files:**
- Modify: `server/db/token-queries.js`

- [ ] **Step 1: Update `validateToken` to handle availability type**

In `server/db/token-queries.js`, replace the body of `validateToken` (the function around lines 17-78) so the gate respects the type. Find:

```js
  if (row.used_at || new Date(row.expires_at) < new Date()) {
    return { valid: false, error: 'Invalid or expired link' }
  }
```

Replace with:

```js
  const isExpired = new Date(row.expires_at) < new Date()
  const isRevoked = row.revoked_at !== null && row.revoked_at !== undefined
  if (isExpired || isRevoked) {
    return { valid: false, error: 'Invalid or expired link' }
  }
  // 'availability' tokens are multi-use; only 'new' / 'update' are consumed.
  if (row.type !== 'availability' && row.used_at) {
    return { valid: false, error: 'Invalid or expired link' }
  }
```

Apply the same change inside `validateAndConsumeToken` (around line 125) — replace its `if (row.used_at || new Date(row.expires_at) < new Date())` block with the same logic. Note: `validateAndConsumeToken` should refuse to consume `'availability'` tokens (they aren't single-use). After the existence check, add:

```js
    if (row.type === 'availability') {
      await client.query('ROLLBACK')
      return { valid: false, error: 'Wrong token type' }
    }
```

- [ ] **Step 2: Add `getActiveAvailabilityToken`**

Append to `server/db/token-queries.js`:

```js
export async function getActiveAvailabilityToken(speakerId) {
  const { rows } = await pool.query(
    `SELECT * FROM speaker_tokens
     WHERE speaker_id = $1
       AND type = 'availability'
       AND revoked_at IS NULL
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [speakerId]
  )
  return rows[0] || null
}
```

- [ ] **Step 3: Add `revokeToken`**

Append:

```js
export async function revokeToken(token) {
  await pool.query(
    `UPDATE speaker_tokens SET revoked_at = NOW()
     WHERE token = $1 AND revoked_at IS NULL`,
    [token]
  )
}
```

- [ ] **Step 4: Update `createToken` to support far-future expiry**

Find `createToken` (line 4). Change the signature to accept either `expiresInDays` OR `expiresAt`:

```js
export async function createToken({ speakerId, type, expiresInDays = 7, expiresAt = null, prefillData = null }) {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = expiresAt
    ? new Date(expiresAt)
    : new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

  const { rows } = await pool.query(
    `INSERT INTO speaker_tokens (speaker_id, token, type, expires_at, prefill_data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [speakerId || null, token, type, expires, prefillData ? JSON.stringify(prefillData) : null]
  )
  return rows[0]
}
```

- [ ] **Step 5: Verify existing tests still pass**

Run: `npm test`
Expected: all existing tests still green.

- [ ] **Step 6: Commit**

```bash
git add server/db/token-queries.js
git commit -m "tokens: support multi-use availability type with revocation"
```

---

## Task 4: Availability DB queries (new file)

**Files:**
- Create: `server/db/availability-queries.js`

- [ ] **Step 1: Implement helpers**

Create `server/db/availability-queries.js`:

```js
import pool from './connection.js'

// Returns blocked dates as 'YYYY-MM-DD' strings, sorted ascending.
// Inclusive on both ends. Caller validates the range size.
export async function getBlockedDates(speakerId, from, to) {
  const { rows } = await pool.query(
    `SELECT to_char(blocked_date, 'YYYY-MM-DD') AS date
     FROM speaker_blocked_dates
     WHERE speaker_id = $1
       AND blocked_date >= $2::date
       AND blocked_date <= $3::date
     ORDER BY blocked_date ASC`,
    [speakerId, from, to]
  )
  return rows.map(r => r.date)
}

// Replaces the speaker's future blocked dates atomically. Past dates are
// untouched (we don't want a stale UI to wipe historic records).
export async function replaceFutureBlockedDates(speakerId, dates) {
  const futureOnly = (dates || []).filter(d => d >= todayIso())
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `DELETE FROM speaker_blocked_dates
       WHERE speaker_id = $1 AND blocked_date >= CURRENT_DATE`,
      [speakerId]
    )
    if (futureOnly.length) {
      await client.query(
        `INSERT INTO speaker_blocked_dates (speaker_id, blocked_date)
         SELECT $1, unnest($2::date[])
         ON CONFLICT DO NOTHING`,
        [speakerId, futureOnly]
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}
```

- [ ] **Step 2: Smoke-test the queries**

Restart the server (`npm run server`), then:

```bash
docker exec flight-speakers-db psql -U postgres -d flight_speakers -c \
  "INSERT INTO speaker_blocked_dates (speaker_id, blocked_date) VALUES ('steven-bartlett', '2030-06-15') ON CONFLICT DO NOTHING;"
```

We'll exercise the helpers via the route in Task 5; nothing to verify yet beyond the file existing.

- [ ] **Step 3: Commit**

```bash
git add server/db/availability-queries.js
git commit -m "db: add availability query helpers"
```

---

## Task 5: Availability route (validate + save)

**Files:**
- Create: `server/routes/availability.js`
- Modify: `server/index.js`

- [ ] **Step 1: Implement the route**

Create `server/routes/availability.js`:

```js
import express from 'express'
import { validateToken } from '../db/token-queries.js'
import {
  getBlockedDates,
  replaceFutureBlockedDates,
} from '../db/availability-queries.js'
import { validate, availabilitySaveSchema } from '../schemas/index.js'

const router = express.Router()

// Returns blocked dates for the next 12 months from today, plus the speaker
// stub the page needs to render its header.
async function bootstrap(token) {
  const result = await validateToken(token)
  if (!result.valid || result.token.type !== 'availability') {
    return { ok: false, message: 'Invalid or expired link' }
  }
  const speakerId = result.token.speaker_id
  if (!speakerId) {
    return { ok: false, message: 'Invalid or expired link' }
  }
  const today = new Date()
  const from = today.toISOString().slice(0, 10)
  const horizon = new Date(today)
  horizon.setFullYear(horizon.getFullYear() + 1)
  const to = horizon.toISOString().slice(0, 10)
  const blocked = await getBlockedDates(speakerId, from, to)
  return {
    ok: true,
    speaker: result.speaker
      ? {
          id: result.speaker.id,
          name: result.speaker.name,
          headline: result.speaker.headline,
          photo: result.speaker.photo,
        }
      : null,
    blocked,
  }
}

router.post('/validate', async (req, res) => {
  const token = req.body?.token
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Token required' })
  }
  try {
    const result = await bootstrap(token)
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message })
    }
    res.json({ success: true, speaker: result.speaker, blocked: result.blocked })
  } catch (err) {
    console.error('Availability validate error:', err)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
})

router.post('/save', async (req, res) => {
  const token = req.body?.token
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Token required' })
  }
  const { token: _t, ...rest } = req.body || {}
  const data = validate({ body: rest }, res, availabilitySaveSchema)
  if (!data) return
  try {
    const result = await validateToken(token)
    if (!result.valid || result.token.type !== 'availability' || !result.token.speaker_id) {
      return res.status(400).json({ success: false, message: 'Invalid or expired link' })
    }
    await replaceFutureBlockedDates(result.token.speaker_id, data.blocked)
    // Echo the freshly-saved set back so the UI can confirm.
    const today = new Date().toISOString().slice(0, 10)
    const horizon = new Date()
    horizon.setFullYear(horizon.getFullYear() + 1)
    const blocked = await getBlockedDates(
      result.token.speaker_id,
      today,
      horizon.toISOString().slice(0, 10),
    )
    res.json({ success: true, blocked })
  } catch (err) {
    console.error('Availability save error:', err)
    res.status(500).json({ success: false, message: 'Failed to save' })
  }
})

export default router
```

- [ ] **Step 2: Mount the route**

In `server/index.js`:

After the import block, add:
```js
import availabilityRouter from './routes/availability.js'
```

After the line `app.use('/api/portal', portalLimiter, portalRouter)` (around line 101), add:
```js
app.use('/api/availability', portalLimiter, availabilityRouter)
```

- [ ] **Step 3: Restart and smoke-test**

Restart the server (`npm run server`). Generate a manual availability token in Postgres:

```bash
docker exec flight-speakers-db psql -U postgres -d flight_speakers -c \
  "INSERT INTO speaker_tokens (speaker_id, token, type, expires_at) VALUES ('steven-bartlett', 'test-avail-token-1', 'availability', NOW() + INTERVAL '100 years') ON CONFLICT (token) DO NOTHING;"
```

Then:
```bash
curl -s -X POST http://localhost:3001/api/availability/validate \
  -H 'Content-Type: application/json' \
  -d '{"token":"test-avail-token-1"}' | jq .
```

Expected: `{ success: true, speaker: {...}, blocked: [...] }`.

```bash
curl -s -X POST http://localhost:3001/api/availability/save \
  -H 'Content-Type: application/json' \
  -d '{"token":"test-avail-token-1","blocked":["2030-06-15","2030-07-04"]}' | jq .
```

Expected: `{ success: true, blocked: ["2030-06-15","2030-07-04"] }`.

- [ ] **Step 4: Commit**

```bash
git add server/routes/availability.js server/index.js
git commit -m "api: add /api/availability validate + save endpoints"
```

---

## Task 6: Public availability endpoint

**Files:**
- Modify: `server/routes/speakers.js`

- [ ] **Step 1: Add the route**

In `server/routes/speakers.js`, **before** the `router.get('/:id', ...)` handler (so its specificity wins; Express routes match in order, and `/:id/availability` will match the `/:id` handler if placed first only when path segments differ — but to be safe, place the new route *before* `/:id`), add:

```js
import { getBlockedDates } from '../db/availability-queries.js'
```

at the top with the other imports, and add this handler before `router.get('/:id', ...)`:

```js
// Public availability read for the enquiry-form calendar.
// Returns only blocked dates — no enquiry IDs, reasons, or other metadata.
router.get('/:id/availability', async (req, res, next) => {
  try {
    const { from, to } = req.query
    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'from and to required (YYYY-MM-DD)' })
    }
    const ISO = /^\d{4}-\d{2}-\d{2}$/
    if (!ISO.test(from) || !ISO.test(to)) {
      return res.status(400).json({ success: false, message: 'Dates must be YYYY-MM-DD' })
    }
    if (to < from) {
      return res.status(400).json({ success: false, message: 'to must be >= from' })
    }
    // Cap the range at 1 year + 1 day to prevent abuse.
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const days = (toDate - fromDate) / (1000 * 60 * 60 * 24)
    if (days > 366) {
      return res.status(400).json({ success: false, message: 'Range cannot exceed 366 days' })
    }
    const blocked = await getBlockedDates(req.params.id, from, to)
    res.json({ success: true, blocked })
  } catch (err) {
    next(err)
  }
})
```

Express matches routes in the order they're declared. `/:id` must come AFTER `/:id/availability` for the specific path to take effect — if `/:id` is already declared first, move it below.

Actually, Express handles this correctly when paths have different segment counts (`/:id` is 1 segment, `/:id/availability` is 2). But to be safe and readable, put the new handler immediately after `router.get('/:id', ...)`.

- [ ] **Step 2: Smoke-test**

```bash
curl -s "http://localhost:3001/api/speakers/steven-bartlett/availability?from=2030-01-01&to=2030-12-31" | jq .
```

Expected: `{ success: true, blocked: [...] }` reflecting whatever was saved in Task 5.

```bash
curl -s "http://localhost:3001/api/speakers/steven-bartlett/availability" | jq .
```

Expected: `{ success: false, message: "from and to required..." }`.

- [ ] **Step 3: Commit**

```bash
git add server/routes/speakers.js
git commit -m "api: add public /api/speakers/:id/availability read endpoint"
```

---

## Task 7: Admin link endpoints

**Files:**
- Modify: `server/routes/admin/speakers.js`

- [ ] **Step 1: Add imports**

Find existing imports in `server/routes/admin/speakers.js`. Add:

```js
import {
  createToken,
  getActiveAvailabilityToken,
  revokeToken,
} from '../../db/token-queries.js'
```

(merge with any existing token-queries import; remove duplicates.)

- [ ] **Step 2: Add the handlers**

Before `export default router`, add:

```js
// One un-revoked availability token per speaker. Returns the existing one or
// lazily creates a new one. Far-future expiry so it's effectively perpetual
// until rotated.
router.get('/:id/availability-link', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    let token = await getActiveAvailabilityToken(id)
    if (!token) {
      const farFuture = new Date()
      farFuture.setFullYear(farFuture.getFullYear() + 100)
      token = await createToken({
        speakerId: id,
        type: 'availability',
        expiresAt: farFuture.toISOString(),
      })
    }
    res.json({ success: true, token: token.token, createdAt: token.created_at })
  } catch (err) {
    console.error('availability-link error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch link' })
  }
})

router.post('/:id/availability-link/rotate', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const current = await getActiveAvailabilityToken(id)
    if (current) {
      await revokeToken(current.token)
    }
    const farFuture = new Date()
    farFuture.setFullYear(farFuture.getFullYear() + 100)
    const token = await createToken({
      speakerId: id,
      type: 'availability',
      expiresAt: farFuture.toISOString(),
    })
    res.json({ success: true, token: token.token, createdAt: token.created_at })
  } catch (err) {
    console.error('rotate availability-link error:', err)
    res.status(500).json({ success: false, message: 'Failed to rotate link' })
  }
})
```

- [ ] **Step 3: Smoke-test (after admin login)**

Log into the admin UI (`http://localhost:3000/admin`) so the cookie is set, then:

```bash
curl -s -b ~/.flight-speakers-admin-cookie \
  http://localhost:3001/api/admin/speakers/steven-bartlett/availability-link | jq .
```

(Or grab the cookie from devtools and pass `-H 'Cookie: admin_token=...'`.)

Expected: `{ success: true, token: "...", createdAt: "..." }`. Calling twice returns the same token.

Rotate:
```bash
curl -s -X POST -H 'Cookie: admin_token=...' -H 'X-CSRF-Token: ...' \
  http://localhost:3001/api/admin/speakers/steven-bartlett/availability-link/rotate | jq .
```

Expected: a different token. The old one should now fail validation.

- [ ] **Step 4: Commit**

```bash
git add server/routes/admin/speakers.js
git commit -m "api: admin endpoints to get-or-create and rotate speaker availability link"
```

---

## Task 8: Speaker availability frontend page

**Files:**
- Create: `src/pages/SpeakerAvailabilityPage.jsx`
- Create: `src/pages/SpeakerAvailabilityPage.css`
- Modify: `src/App.jsx`

- [ ] **Step 1: Build the page**

Create `src/pages/SpeakerAvailabilityPage.jsx`:

```jsx
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { EASE } from '../constants/animation'
import './SpeakerAvailabilityPage.css'

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function readToken() {
  if (typeof window === 'undefined') return ''
  return window.location.hash.replace(/^#/, '')
}

function toIso(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildMonths(today) {
  const months = []
  for (let i = 0; i < 12; i++) {
    const m = (today.getMonth() + i) % 12
    const y = today.getFullYear() + Math.floor((today.getMonth() + i) / 12)
    months.push({ year: y, month: m })
  }
  return months
}

export default function SpeakerAvailabilityPage() {
  const [token] = useState(readToken)
  const [status, setStatus] = useState('loading') // loading | valid | invalid | saving | saved
  const [error, setError] = useState('')
  const [speaker, setSpeaker] = useState(null)
  const [blocked, setBlocked] = useState(() => new Set())
  const [savedBlocked, setSavedBlocked] = useState(() => new Set())

  const today = useMemo(() => new Date(), [])
  const todayIso = useMemo(() => today.toISOString().slice(0, 10), [today])
  const months = useMemo(() => buildMonths(today), [today])

  const dirty = useMemo(() => {
    if (blocked.size !== savedBlocked.size) return true
    for (const d of blocked) if (!savedBlocked.has(d)) return true
    return false
  }, [blocked, savedBlocked])

  useEffect(() => {
    if (!token) {
      setError('Missing or invalid link.')
      setStatus('invalid')
      return
    }
    fetch('/api/availability/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSpeaker(data.speaker)
          const set = new Set(data.blocked || [])
          setBlocked(set)
          setSavedBlocked(new Set(set))
          setStatus('valid')
        } else {
          setError(data.message || 'Invalid link')
          setStatus('invalid')
        }
      })
      .catch(() => {
        setError('Unable to load. Please try again.')
        setStatus('invalid')
      })
  }, [token])

  const toggleDay = (iso) => {
    if (iso < todayIso) return
    setBlocked(prev => {
      const next = new Set(prev)
      if (next.has(iso)) next.delete(iso)
      else next.add(iso)
      return next
    })
  }

  const handleSave = async () => {
    setStatus('saving')
    try {
      const res = await fetch('/api/availability/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, blocked: Array.from(blocked) }),
      })
      const data = await res.json()
      if (data.success) {
        const set = new Set(data.blocked || [])
        setBlocked(set)
        setSavedBlocked(new Set(set))
        setStatus('saved')
        setTimeout(() => setStatus('valid'), 1800)
      } else {
        setError(data.message || 'Failed to save')
        setStatus('valid')
      }
    } catch {
      setError('Failed to save. Please try again.')
      setStatus('valid')
    }
  }

  if (status === 'loading') {
    return (
      <div className="avail-page">
        <div className="avail-page__loading">Loading…</div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="avail-page">
        <div className="avail-page__invalid">
          <h1>Link expired</h1>
          <p>{error}</p>
          <p>Please contact Flight Speakers for a fresh link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="avail-page">
      <motion.header
        className="avail-page__header"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        {speaker?.photo && (
          <img className="avail-page__photo" src={speaker.photo} alt="" />
        )}
        <div>
          <h1 className="avail-page__title">
            {speaker?.name ? `${speaker.name}'s availability` : 'Availability'}
          </h1>
          <p className="avail-page__subtitle">
            Tap any future day to mark it as <strong>booked</strong>. We'll only show
            clients dates you can actually do.
          </p>
        </div>
      </motion.header>

      <main className="avail-page__months">
        {months.map(({ year, month }) => {
          const daysInMonth = new Date(year, month + 1, 0).getDate()
          const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7
          return (
            <section key={`${year}-${month}`} className="avail-month">
              <h2 className="avail-month__label">{MONTHS[month]} {year}</h2>
              <div className="avail-month__days-header">
                {DAYS.map(d => <span key={d}>{d}</span>)}
              </div>
              <div className="avail-month__grid">
                {Array.from({ length: firstDayOfWeek }, (_, i) => (
                  <div key={`empty-${i}`} className="avail-cell avail-cell--empty" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const iso = toIso(year, month, day)
                  const past = iso < todayIso
                  const isBlocked = blocked.has(iso)
                  return (
                    <button
                      key={day}
                      type="button"
                      className={[
                        'avail-cell',
                        past && 'avail-cell--past',
                        isBlocked && 'avail-cell--blocked',
                      ].filter(Boolean).join(' ')}
                      onClick={() => toggleDay(iso)}
                      disabled={past}
                    >
                      <span>{day}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </main>

      <div className="avail-page__save-bar">
        <span className="avail-page__count">
          {blocked.size === 0
            ? 'No dates blocked'
            : `${blocked.size} date${blocked.size === 1 ? '' : 's'} blocked`}
        </span>
        <button
          className="avail-page__save-btn"
          onClick={handleSave}
          disabled={!dirty || status === 'saving'}
        >
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add styles**

Create `src/pages/SpeakerAvailabilityPage.css`:

```css
.avail-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  padding: 2.5rem 1.5rem 8rem;
  max-width: 980px;
  margin: 0 auto;
}

.avail-page__loading,
.avail-page__invalid {
  text-align: center;
  padding: 6rem 1rem;
  color: var(--color-text-muted);
}

.avail-page__invalid h1 {
  font-size: var(--text-2xl);
  margin-bottom: .75rem;
  color: var(--color-text-primary);
}

.avail-page__header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 2.5rem;
}

.avail-page__photo {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}

.avail-page__title {
  font-size: var(--text-2xl);
  font-weight: 600;
  margin: 0 0 .25rem;
}

.avail-page__subtitle {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
  max-width: 56ch;
  line-height: 1.5;
}

.avail-page__months {
  display: grid;
  gap: 2rem;
  grid-template-columns: 1fr;
}

@media (min-width: 720px) {
  .avail-page__months {
    grid-template-columns: 1fr 1fr;
  }
}

.avail-month {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 1rem 1.25rem 1.25rem;
}

.avail-month__label {
  font-size: var(--text-base);
  font-weight: 600;
  margin: 0 0 .75rem;
}

.avail-month__days-header,
.avail-month__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.avail-month__days-header {
  margin-bottom: 4px;
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: .04em;
  text-align: center;
}

.avail-cell {
  aspect-ratio: 1 / 1;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color .15s ease, border-color .15s ease, color .15s ease;
}

.avail-cell:hover:not(:disabled) {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
}

.avail-cell--empty {
  visibility: hidden;
}

.avail-cell--past {
  color: var(--color-text-muted);
  cursor: not-allowed;
  opacity: 0.4;
}

.avail-cell--blocked {
  background: rgba(232, 93, 76, 0.16);
  border-color: rgba(232, 93, 76, 0.45);
  color: var(--color-accent);
}

.avail-cell--blocked:hover:not(:disabled) {
  background: rgba(232, 93, 76, 0.26);
}

.avail-page__save-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  backdrop-filter: blur(6px);
  z-index: 10;
}

.avail-page__count {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.avail-page__save-btn {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: 999px;
  padding: .65rem 1.5rem;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: opacity .15s ease, background .15s ease;
}

.avail-page__save-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.avail-page__save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

- [ ] **Step 3: Add the route**

In `src/App.jsx`, add the import near the other page imports:

```jsx
import SpeakerAvailabilityPage from './pages/SpeakerAvailabilityPage'
```

And the route — add it next to `<Route path="/speaker-portal" element={<SpeakerPortalPage />} />`:

```jsx
<Route path="/speaker-availability" element={<SpeakerAvailabilityPage />} />
```

- [ ] **Step 4: Manual smoke test**

Run `npm run dev:all`. Visit:
```
http://localhost:3000/speaker-availability#test-avail-token-1
```

Expected: page loads, header shows speaker name, calendar grid renders 12 months with the previously-saved blocked days highlighted in red. Tapping a future day toggles the red state. "Save changes" enables when dirty, persists on click, shows "Saved ✓" briefly.

- [ ] **Step 5: Commit**

```bash
git add src/pages/SpeakerAvailabilityPage.jsx src/pages/SpeakerAvailabilityPage.css src/App.jsx
git commit -m "ui: speaker availability self-service page"
```

---

## Task 9: Wire real availability into the enquiry-form calendar

**Files:**
- Create: `src/components/forms/useSpeakerAvailability.js`
- Modify: `src/components/forms/AvailabilityCalendar.jsx`

- [ ] **Step 1: Create the hook**

Create `src/components/forms/useSpeakerAvailability.js`:

```js
import { useEffect, useState } from 'react'

// Fetches blocked dates for a speaker over a fixed forward window and
// caches per (speakerId, from, to) for the session. Falls back to an empty
// set on any error so the calendar still renders.
const cache = new Map()

function cacheKey(speakerId, from, to) {
  return `${speakerId}|${from}|${to}`
}

export function useSpeakerAvailability(speakerId, from, to) {
  const [blocked, setBlocked] = useState(() => new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!speakerId || !from || !to) {
      setBlocked(new Set())
      return
    }
    const key = cacheKey(speakerId, from, to)
    if (cache.has(key)) {
      setBlocked(cache.get(key))
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/speakers/${encodeURIComponent(speakerId)}/availability?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        const set = new Set(data?.blocked || [])
        cache.set(key, set)
        setBlocked(set)
      })
      .catch(() => {
        // Silently fall back to an empty set — the form should still work.
        cache.set(key, new Set())
        if (!cancelled) setBlocked(new Set())
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [speakerId, from, to])

  return { blocked, loading }
}
```

- [ ] **Step 2: Refactor `AvailabilityCalendar.jsx`**

In `src/components/forms/AvailabilityCalendar.jsx`:

a) Replace the imports block (top of file) with:

```jsx
import { useState, useRef, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE } from '../../constants/animation'
import { formatEventDate } from '../../utils/dateFormat'
import { useSpeakerAvailability } from './useSpeakerAvailability'
```

(Drop `formatDisplayDate` if it isn't used elsewhere in the file — preserve it if so.)

b) Delete the helpers `seededRandom`, `hashString`, and `generateAvailability` entirely (lines ~16-52 in the current file).

c) Inside the component, replace the `availability` `useMemo` (the one calling `generateAvailability`) with hook usage. Compute the forward range once (today through +12 months) at the top of the component:

```jsx
  const today = new Date()
  const fromIso = useMemo(() => today.toISOString().slice(0, 10), [])
  const toIso = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().slice(0, 10)
  }, [])

  const { blocked: blockedSet } = useSpeakerAvailability(speakerId, fromIso, toIso)
```

d) Replace any usage of the old `availability[day]` lookup. The old code used three states; the new code is binary. Define a helper inside the component:

```jsx
  const dayState = (day) => {
    const iso = toDateStr(year, month, day)
    return blockedSet.has(iso) ? 'unavailable' : 'available'
  }
```

e) In the render, update where `const avail = availability[day]` was used to call `dayState(day)` instead. The CSS classes `cal__cell--available` / `cal__cell--unavailable` already exist; the old `cal__cell--limited` styles can stay in CSS but won't be applied.

f) Update the legend block — drop the "Limited" `<span>` so only "Likely available" and "Booked" remain.

g) Update `selectedAvail` (around line 232) to use the new state:

```jsx
  const selectedAvail = (!rangeMode && selectedStart && !selectedEnd)
    ? (() => {
        const d = new Date(selectedStart)
        if (d.getFullYear() === year && d.getMonth() === month) {
          return dayState(d.getDate())
        }
        return null
      })()
    : null
```

h) Update the badge label — replace the trinary expression for `selectedAvail` text with binary:

```jsx
        {value && selectedAvail && (
          <span className={`cal-input__badge cal-input__badge--${selectedAvail}`}>
            {selectedAvail === 'available' ? 'Likely available' : 'Booked'}
          </span>
        )}
```

- [ ] **Step 3: Manual smoke test in the browser**

Run `npm run dev:all`. Visit `http://localhost:3000/enquiry/steven-bartlett`, navigate to the date step, and confirm:
- The calendar renders without the `seededRandom`/PRNG dependency.
- Days you previously blocked via Task 8 show as red/booked.
- Other future days show as available (no limited state, no orange dots).
- Picking an unblocked day shows the "Likely available" badge; picking a blocked day shows "Booked".

- [ ] **Step 4: Commit**

```bash
git add src/components/forms/useSpeakerAvailability.js src/components/forms/AvailabilityCalendar.jsx
git commit -m "ui: enquiry-form calendar reads real speaker availability"
```

---

## Task 10: Admin availability link panel

**Files:**
- Modify: `src/admin/pages/AdminSpeakerDetailPage.jsx`

- [ ] **Step 1: Add state, handlers, UI**

In the component (around the existing `inviteLink` state, ~line 18), add:

```jsx
  const [availLink, setAvailLink] = useState('')
  const [availLoading, setAvailLoading] = useState(false)
  const [availCopied, setAvailCopied] = useState(false)
  const [rotateConfirm, setRotateConfirm] = useState(false)
```

After `useEffect` that loads speaker, add:

```jsx
  useEffect(() => {
    fetch(`/api/admin/speakers/${id}/availability-link`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAvailLink(`${window.location.origin}/speaker-availability#${data.token}`)
        }
      })
      .catch(() => { /* silent */ })
  }, [id])
```

Add handlers:

```jsx
  const handleCopyAvailLink = useCallback(() => {
    navigator.clipboard.writeText(availLink)
    setAvailCopied(true)
    setTimeout(() => setAvailCopied(false), 1800)
  }, [availLink])

  const handleRotateAvailLink = useCallback(async () => {
    setAvailLoading(true)
    try {
      const csrf = document.cookie.split('; ').find(c => c.startsWith('csrf_token='))?.split('=')[1]
      const res = await fetch(`/api/admin/speakers/${id}/availability-link/rotate`, {
        method: 'POST',
        credentials: 'include',
        headers: csrf ? { 'X-CSRF-Token': decodeURIComponent(csrf) } : {},
      })
      const data = await res.json()
      if (data.success) {
        setAvailLink(`${window.location.origin}/speaker-availability#${data.token}`)
      }
    } catch { /* ignore */ }
    setAvailLoading(false)
    setRotateConfirm(false)
  }, [id])
```

Render — place this block near the existing invite-link panel (around the `{inviteLink && (` block):

```jsx
        {availLink && (
          <div className="speaker-detail__invite-link" style={{ marginTop: '0.5rem' }}>
            <input
              className="speaker-detail__invite-input"
              value={availLink}
              readOnly
              onClick={e => e.target.select()}
              title="Speaker availability link"
            />
            <button className="speaker-detail__invite-copy" onClick={handleCopyAvailLink}>
              {availCopied ? 'Copied!' : 'Copy availability link'}
            </button>
            {rotateConfirm ? (
              <>
                <button
                  className="speaker-detail__invite-copy"
                  style={{ background: '#7f1d1d' }}
                  onClick={handleRotateAvailLink}
                  disabled={availLoading}
                >
                  {availLoading ? 'Rotating…' : 'Confirm rotate'}
                </button>
                <button
                  className="speaker-detail__invite-copy"
                  onClick={() => setRotateConfirm(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="speaker-detail__invite-copy"
                onClick={() => setRotateConfirm(true)}
                title="Invalidate the existing availability link and create a new one"
              >
                Rotate
              </button>
            )}
          </div>
        )}
```

- [ ] **Step 2: Smoke test**

Reload `/admin/speakers/steven-bartlett`. Confirm:
- The new "Copy availability link" panel appears under the invite-link area.
- Copy puts a `https://.../speaker-availability#<token>` URL on the clipboard.
- Opening that link shows the speaker's calendar (Task 8 page).
- Clicking Rotate -> Confirm rotate replaces the URL with a new token.
- Old URL now shows the "Link expired" error.

- [ ] **Step 3: Commit**

```bash
git add src/admin/pages/AdminSpeakerDetailPage.jsx
git commit -m "admin: availability link panel with copy and rotate"
```

---

## Task 11: End-to-end verification

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Full flow**

1. Open admin -> a speaker -> copy the availability link.
2. Open the link in a private window. Block a few future dates. Save.
3. Open `/enquiry/<that-speaker-id>` in another tab. Open the date picker. Confirm those days render as "Booked".
4. Back in admin, rotate the link. Confirm the old URL fails. New URL works.
5. Refresh the admin page; confirm the link persists across reloads (it shouldn't change unless rotated).

- [ ] **Step 3: Final commit / cleanup**

If any test fixes or polish is needed, make them in a single follow-up commit. Otherwise nothing further.

---

## Self-review notes

- Spec coverage: schema (T1), public read (T6), speaker portal (T8), admin link (T7+T10), enquiry calendar wiring (T9), token semantics (T3) — all covered.
- TDD: applied where it adds confidence (schema validation, T2). DB-touching code is verified via curl/manual flow because the existing repo has no DB integration tests; matching the codebase pattern.
- No placeholders. All code blocks are complete.
- Rate limiting: relies on the existing `portalLimiter` mounted at `/api/availability`. The public read at `/api/speakers/:id/availability` shares the speakers router and is not rate-limited beyond what `viewLimiter`-style behaviour already covers; this is acceptable for v1 since the response is small and the data is non-sensitive. If abuse appears, add a dedicated limiter.
