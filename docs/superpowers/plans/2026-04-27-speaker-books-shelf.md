# Speaker Books Shelf Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dev-only CSS-gradient book placeholder with a production 3D shelf showing real cover artwork for the 7 author-speakers.

**Architecture:** Add a JSONB `books` column to the `speakers` table. A one-off Node script downloads covers from Open Library (and reads two from a local directory for Davina's books that OL doesn't have), uploads them to the existing GCS bucket, and prints a JS snippet to paste into `server/data/speakers.js`. Frontend swaps the gradient `<div>` cover for an `<img>` element while keeping the existing 3D rotation, perspective, hover, and shelf-board treatment intact.

**Tech Stack:** Express 5, PostgreSQL 16, `@google-cloud/storage` (already a dep), React 18, vitest

**Testing approach:** This codebase tests zod schemas only — no DB query unit tests, no React component tests (`server/schemas/*.test.js` are the only test files). The book feature has no zod schema (books are not admin-input — they enter via seed only), no business logic to unit-test, and the 3D/CSS work can only be verified visually. Each task therefore ends with a manual smoke test plus `npm test` to confirm no regression in the existing suite.

---

## Files Touched

| File | Status | Purpose |
|---|---|---|
| `server/db/init.sql` | modify | Add `books` column for fresh installs |
| `server/db/migrate.js` | modify | Idempotent ALTER for production deploys |
| `server/db/queries.js` | modify | Return `books` from `getSpeakerById` / `getAllSpeakers` |
| `server/db/seed.js` | modify | Include `books` in upsert |
| `server/scripts/seed-books.js` | NEW | One-off downloader, uploader, snippet-printer (~120 lines) |
| `tmp/manual-covers/davina-mccall/menopausing.jpg` | one-time stage | User-supplied cover (OL has no image) |
| `tmp/manual-covers/davina-mccall/lessons-for-survival.jpg` | one-time stage | User-supplied cover (OL has no entry) |
| `server/data/speakers.js` | modify | Paste seeder output: `books: [...]` field on 7 speakers |
| `src/pages/SpeakerDetailPage.jsx` | modify | Drop SPEAKER_BOOKS lookup + DEV gate; render `<img>` cover |
| `src/pages/SpeakerDetailPage.css` | modify | Smaller dimensions, drop overlay text rules, image-derived spine |

`server/scripts/` is a new directory — no existing convention to disrupt. `tmp/` will be added to `.gitignore` if it isn't already (we don't commit cover sources).

---

## Task 1: Add `books` column to the schema

Add a JSONB column for books to the `speakers` table. Two paths for the same DDL: `init.sql` for fresh local installs, `migrate.js` for production (Cloud SQL doesn't auto-apply `init.sql`).

**Files:**
- Modify: `server/db/init.sql:61` (after the existing social_stats ALTER)
- Modify: `server/db/migrate.js:10-16` (inside `applyMigrations`)

- [ ] **Step 1: Add ALTER to `init.sql`**

Open `server/db/init.sql`. After line 61 (`ALTER TABLE speakers ADD COLUMN IF NOT EXISTS social_stats_updated_at TIMESTAMPTZ;`), add:

```sql
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS books JSONB NOT NULL DEFAULT '[]'::jsonb;
```

This places it next to the other "added later" speaker columns (`social_profiles`, `social_stats`), matching the existing pattern. `NOT NULL DEFAULT '[]'::jsonb` means the column is always an array (never `NULL`) — simpler API contract.

- [ ] **Step 2: Add ALTER to `migrate.js`**

Open `server/db/migrate.js`. In `applyMigrations()`, after the existing `revoked_jwts` block, add a new query call:

```js
await pool.query(`
  ALTER TABLE speakers ADD COLUMN IF NOT EXISTS books JSONB NOT NULL DEFAULT '[]'::jsonb;
`)
```

Idempotent — safe to run repeatedly on existing databases.

- [ ] **Step 3: Apply locally**

Restart the Express server so migrations run on startup:

```bash
npm run server
```

Watch the log for `Migrations applied`. If you see `[migrations] attempt N failed`, the retry-with-backoff handles it; wait for success.

- [ ] **Step 4: Verify column exists**

In a new terminal:

```bash
docker exec -it flight-speakers-db psql -U postgres -d flight_speakers -c "\d speakers" | grep books
```

Expected output (one line, exact format may vary):
```
 books              | jsonb                    |           | not null | '[]'::jsonb
```

If the line is missing, the migration didn't run — check the server log.

- [ ] **Step 5: Run regression suite**

```bash
npm test
```

Expected: `25 passed` (or whatever the current count is) — no test changes yet, just confirming nothing broke.

- [ ] **Step 6: Commit**

```bash
git add server/db/init.sql server/db/migrate.js
git commit -m "add books JSONB column to speakers"
```

---

## Task 2: Return `books` from the speakers API

Wire the new column through the read path so `/api/speakers/:id` includes `books` in its response. Also wire it through `seed.js` so future re-seeds preserve any `books` field set on the speaker objects.

**Files:**
- Modify: `server/db/queries.js:3-11` (the `SPEAKER_COLUMNS` constant)
- Modify: `server/db/seed.js:15-50` (the upsert)

- [ ] **Step 1: Add `books` to `SPEAKER_COLUMNS`**

Open `server/db/queries.js`. The constant currently reads:

```js
const SPEAKER_COLUMNS = `
  id, name, headline, photo, bio, topics, audiences, keynotes,
  speaking_format AS "speakingFormat",
  video_url AS "videoUrl",
  social_stats AS "socialStats",
  social_profiles AS "socialProfiles",
  fee_min AS "feeMin",
  gender, ethnicity, nationality, location
`
```

Change it to add `books` on its own line at the end:

```js
const SPEAKER_COLUMNS = `
  id, name, headline, photo, bio, topics, audiences, keynotes,
  speaking_format AS "speakingFormat",
  video_url AS "videoUrl",
  social_stats AS "socialStats",
  social_profiles AS "socialProfiles",
  fee_min AS "feeMin",
  gender, ethnicity, nationality, location,
  books
`
```

JSONB columns return as JS objects/arrays automatically via `pg` — no additional parsing needed.

- [ ] **Step 2: Update `seed.js` upsert**

Open `server/db/seed.js`. The current INSERT statement does not include `books`. Add it. Find the INSERT block (lines 15-33) and update three places:

The column list (line 16) — add `books`:

```js
`INSERT INTO speakers (id, name, headline, photo, bio, topics, audiences, keynotes, speaking_format, video_url, social_profiles, fee_min, gender, nationality, location, books)
```

The VALUES placeholders (line 17) — add `$16`:

```js
 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
```

The ON CONFLICT update (after line 32) — add the `books` line before `updated_at`:

```js
         books = EXCLUDED.books,
         updated_at = NOW()`,
```

The params array (lines 34-50) — add a final entry:

```js
        speaker.location || null,
        JSON.stringify(speaker.books || []),
      ]
```

The `JSON.stringify(... || [])` mirrors how `social_profiles` is serialized one line above and ensures speakers without books get `[]` (not `null` / `undefined`).

- [ ] **Step 3: Re-seed and verify via curl**

```bash
npm run db:seed
```

Expected: `Seeded: <each speaker name>` for all 13 speakers, ending with `Done. 13 speakers in database.`

Verify the API now returns the field:

```bash
curl -s http://localhost:3001/api/speakers/steven-bartlett | jq '.books'
```

Expected: `[]` (empty array — we haven't added any books to the data file yet).

- [ ] **Step 4: Run regression suite**

```bash
npm test
```

Expected: still `25 passed` (or current count).

- [ ] **Step 5: Commit**

```bash
git add server/db/queries.js server/db/seed.js
git commit -m "return books field from speakers API"
```

---

## Task 3: Build the seeder script

A one-off Node script that downloads each curated book cover, uploads it to GCS, and prints a JS snippet for the user to paste into `server/data/speakers.js`. The script supports two source types: `openLibraryCoverId` (auto-fetched) and `localPath` (read from disk for the two Davina books OL doesn't have).

**Files:**
- Create: `server/scripts/seed-books.js`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p server/scripts
```

- [ ] **Step 2: Write the script**

Create `server/scripts/seed-books.js` with this exact content:

```js
// One-off seeder for speaker book covers. Downloads from Open Library
// (or reads from a local file for books OL doesn't have), uploads to GCS,
// and prints a JS snippet to paste into server/data/speakers.js.
//
// Run: node server/scripts/seed-books.js
//
// For books with `localPath`, drop the cover image at the path before running.

import 'dotenv/config'
import { Storage } from '@google-cloud/storage'
import { readFile } from 'node:fs/promises'

const GCS_BUCKET = process.env.GCS_BUCKET || 'flight-speakers-photos'
const bucket = new Storage().bucket(GCS_BUCKET)

const SMALL_FILE_THRESHOLD = 20 * 1024 // 20 KB — warn if cover is suspiciously low-res

const BOOKS = [
  // Steven Bartlett
  { speakerId: 'steven-bartlett', slug: 'the-diary-of-a-ceo', title: 'The Diary of a CEO', openLibraryCoverId: 15208285 },
  { speakerId: 'steven-bartlett', slug: 'happy-sexy-millionaire', title: 'Happy Sexy Millionaire', openLibraryCoverId: 12440455 },
  // Nir Eyal
  { speakerId: 'nir-eyal', slug: 'hooked', title: 'Hooked', openLibraryCoverId: 12511799 },
  { speakerId: 'nir-eyal', slug: 'indistractable', title: 'Indistractable', openLibraryCoverId: 9129784 },
  // Vanessa Van Edwards
  { speakerId: 'vanessa-van-edwards', slug: 'captivate', title: 'Captivate', openLibraryCoverId: 10951273 },
  { speakerId: 'vanessa-van-edwards', slug: 'cues', title: 'Cues', openLibraryCoverId: 12854323 },
  // Davina McCall — OL has no covers for these; user stages images locally
  { speakerId: 'davina-mccall', slug: 'menopausing', title: 'Menopausing', localPath: 'tmp/manual-covers/davina-mccall/menopausing.jpg' },
  { speakerId: 'davina-mccall', slug: 'lessons-for-survival', title: 'Lessons for Survival', localPath: 'tmp/manual-covers/davina-mccall/lessons-for-survival.jpg' },
  // Paul C Brunson
  { speakerId: 'paul-c-brunson', slug: 'its-complicated', title: "It's Complicated But It Doesn't Have To Be", openLibraryCoverId: 7516589 },
  // Evy Poumpouras
  { speakerId: 'evy-poumpouras', slug: 'becoming-bulletproof', title: 'Becoming Bulletproof', openLibraryCoverId: 10359658 },
  // Vonda Wright
  { speakerId: 'vonda-wright', slug: 'fitness-after-40', title: 'Fitness After 40', openLibraryCoverId: 12641684 },
  { speakerId: 'vonda-wright', slug: 'younger-in-8-weeks', title: 'Younger in 8 Weeks', openLibraryCoverId: 12633838 },
  { speakerId: 'vonda-wright', slug: 'guide-to-thrive', title: "Dr Vonda Wright's Guide to Thrive", openLibraryCoverId: 8255548 },
]

async function loadBookBuffer(book) {
  if (book.openLibraryCoverId) {
    const url = `https://covers.openlibrary.org/b/id/${book.openLibraryCoverId}-L.jpg?default=false`
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) throw new Error(`Open Library returned HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    return { buffer, contentType: res.headers.get('content-type') || 'image/jpeg' }
  }
  if (book.localPath) {
    const buffer = await readFile(book.localPath)
    const contentType = book.localPath.endsWith('.png') ? 'image/png' : 'image/jpeg'
    return { buffer, contentType }
  }
  throw new Error('book has no source (need openLibraryCoverId or localPath)')
}

async function uploadCover(speakerId, slug, buffer, contentType) {
  const ext = contentType === 'image/png' ? '.png' : '.jpg'
  const gcsPath = `books/${speakerId}/${slug}${ext}`
  await bucket.file(gcsPath).save(buffer, {
    contentType,
    metadata: { cacheControl: 'public, max-age=31536000' },
  })
  return `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`
}

async function main() {
  const grouped = {}
  let warnings = 0
  let failures = 0

  for (const book of BOOKS) {
    const label = `[${book.speakerId}/${book.slug}]`
    try {
      console.log(`${label} loading...`)
      const { buffer, contentType } = await loadBookBuffer(book)
      if (buffer.byteLength < SMALL_FILE_THRESHOLD) {
        console.warn(`${label}   small file (${(buffer.byteLength / 1024).toFixed(1)} KB) — review for low resolution`)
        warnings++
      }
      const coverUrl = await uploadCover(book.speakerId, book.slug, buffer, contentType)
      console.log(`${label}   uploaded -> ${coverUrl}`)
      if (!grouped[book.speakerId]) grouped[book.speakerId] = []
      grouped[book.speakerId].push({ title: book.title, coverUrl })
    } catch (err) {
      console.error(`${label}   FAILED: ${err.message}`)
      failures++
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('PASTE INTO server/data/speakers.js (one block per speaker):')
  console.log('='.repeat(70))
  for (const [speakerId, books] of Object.entries(grouped)) {
    const json = JSON.stringify(books, null, 6).split('\n').map((l, i) => i === 0 ? l : '    ' + l).join('\n')
    console.log(`\n// ${speakerId}\nbooks: ${json},`)
  }

  console.log('\n' + '='.repeat(70))
  console.log(`Done. ${BOOKS.length - failures} succeeded, ${failures} failed, ${warnings} small-file warnings.`)
  if (failures > 0) process.exitCode = 1
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
```

- [ ] **Step 3: Confirm GCS auth is in place**

Confirm Application Default Credentials are configured (the script uses `new Storage()` with no args — same pattern as `server/routes/admin/_uploads.js:7`):

```bash
gcloud auth application-default print-access-token | head -c 20 && echo "..."
```

Expected: a non-empty token prefix. If the command errors with "ADC not found", run:

```bash
gcloud auth application-default login
```

(Choose the `diana@steven.com` account on the `flight-speakers` project.)

- [ ] **Step 4: Add `tmp/` to `.gitignore`**

Open `.gitignore` at the repo root. If `tmp/` isn't already listed, add a line:

```
tmp/
```

This keeps user-staged cover sources out of the repo. Commit if you changed it:

```bash
git add .gitignore && git commit -m "ignore tmp/ for staged cover assets"
```

(Skip the commit if `.gitignore` already had the entry.)

- [ ] **Step 5: Commit the seeder**

```bash
git add server/scripts/seed-books.js
git commit -m "add seed-books script for speaker book covers"
```

---

## Task 4: Run seeder, populate speakers.js, re-seed DB

The seeder needs Davina's two cover images on local disk before running. Once it runs, it prints a JS snippet that gets pasted into `server/data/speakers.js`. After paste, re-seeding the DB pushes the books to the local API.

**Files:**
- Stage (one-time): `tmp/manual-covers/davina-mccall/menopausing.jpg`
- Stage (one-time): `tmp/manual-covers/davina-mccall/lessons-for-survival.jpg`
- Modify: `server/data/speakers.js` (paste a `books: [...]` field on 7 speakers)

- [ ] **Step 1: Stage Davina's covers**

Save cover images for *Menopausing* (2022) and *Lessons for Survival* (2024) to disk. Source can be any: Penguin/HQ product page, the publisher's marketing assets, even Amazon — we re-host on our own GCS so we don't depend on the source URL surviving.

```bash
mkdir -p tmp/manual-covers/davina-mccall
# then save files as:
#   tmp/manual-covers/davina-mccall/menopausing.jpg
#   tmp/manual-covers/davina-mccall/lessons-for-survival.jpg
ls -la tmp/manual-covers/davina-mccall/
```

Expected: two `.jpg` files listed. If you can only find PNG sources, save as `.png` and update the script's BOOKS entries to match the extension before running.

- [ ] **Step 2: Run the seeder**

```bash
node server/scripts/seed-books.js
```

Expected output (final lines):
```
Done. 13 succeeded, 0 failed, N small-file warnings.
```

`small-file warnings` are informational — Open Library covers vary in resolution. We pre-checked sizes during planning; the *Cues* cover is the smallest at ~5.5 KB and will likely warn. We'll judge in the browser whether it's good enough; if not, swap that one to a manual cover later.

If any book FAILED (download error or missing local file), fix the cause (re-stage Davina images, retry network) and re-run. The script is fully idempotent — re-running just overwrites the GCS objects.

- [ ] **Step 3: Spot-check one cover in the browser**

Take any URL from the script output — e.g. `https://storage.googleapis.com/flight-speakers-photos/books/steven-bartlett/the-diary-of-a-ceo.jpg` — and open it in a browser. Expected: a real book cover image displays. If you get 403 or 404, the GCS bucket-level public-read setting may not apply to the new path; re-check your `gsutil iam` config against the speaker-photos path that already works.

- [ ] **Step 4: Paste the snippet into `server/data/speakers.js`**

The script prints 7 blocks (one per author-speaker). For each block, find the matching speaker object in `server/data/speakers.js` and add the `books: [...]` field as the last property before the closing `}`, just after `socialProfiles`.

For example, the Steven Bartlett block becomes (showing the bottom of his object):

```js
    socialProfiles: {
      instagram: 'stevenbartlett',
      x: 'SteveBartlettSC',
      linkedin: 'stevenbartlett',
      youtube: 'TheDiaryOfACEO',
      tiktok: 'stevenbartlett',
    },
    books: [
      {
        "title": "The Diary of a CEO",
        "coverUrl": "https://storage.googleapis.com/flight-speakers-photos/books/steven-bartlett/the-diary-of-a-ceo.jpg"
      },
      {
        "title": "Happy Sexy Millionaire",
        "coverUrl": "https://storage.googleapis.com/flight-speakers-photos/books/steven-bartlett/happy-sexy-millionaire.jpg"
      }
    ],
  },
```

Repeat for: nir-eyal, vanessa-van-edwards, davina-mccall, paul-c-brunson, evy-poumpouras, vonda-wright. The other 6 speakers (jordan-schwarzenberger, harry-stebbings, nischa-shah, kristen-holmes, paul-scanlon, maggie-sellers) get NO `books` field — the absence is correct and the frontend conditions on `speaker.books?.length > 0`.

- [ ] **Step 5: Re-seed the local DB**

```bash
npm run db:seed
```

Expected: `Done. 13 speakers in database.`

- [ ] **Step 6: Verify the API returns books**

```bash
curl -s http://localhost:3001/api/speakers/steven-bartlett | jq '.books'
```

Expected:
```json
[
  { "title": "The Diary of a CEO", "coverUrl": "https://storage.googleapis.com/flight-speakers-photos/books/steven-bartlett/the-diary-of-a-ceo.jpg" },
  { "title": "Happy Sexy Millionaire", "coverUrl": "https://storage.googleapis.com/flight-speakers-photos/books/steven-bartlett/happy-sexy-millionaire.jpg" }
]
```

Spot-check one more:

```bash
curl -s http://localhost:3001/api/speakers/harry-stebbings | jq '.books'
```

Expected: `[]` (Harry has no books; the field is `[]` thanks to the column default).

- [ ] **Step 7: Run regression suite**

```bash
npm test
```

Expected: still `25 passed` (or current count).

- [ ] **Step 8: Commit**

```bash
git add server/data/speakers.js
git commit -m "seed real book covers for 7 author-speakers"
```

---

## Task 5: Render real covers on the speaker detail page

Drop the dev-only inline `SPEAKER_BOOKS` lookup, drop the `import.meta.env.DEV` gate, and replace the gradient `<div>` cover with an `<img>` whose source is the GCS URL. Shrink dimensions per the spec (130×190 desktop / 100×145 mobile). Replace the spine's `color-mix` gradient with an image-derived darkened/desaturated version of the cover.

**Files:**
- Modify: `src/pages/SpeakerDetailPage.jsx:12-28` (delete SPEAKER_BOOKS constant)
- Modify: `src/pages/SpeakerDetailPage.jsx:539-586` (the book-shelf JSX block)
- Modify: `src/pages/SpeakerDetailPage.css:1279-1421` (the `.book*` rules)

- [ ] **Step 1: Remove the inline `SPEAKER_BOOKS` constant**

Open `src/pages/SpeakerDetailPage.jsx`. Delete lines 12-28 (the comment and the `const SPEAKER_BOOKS = { ... }` block). Just delete them — don't replace with anything.

- [ ] **Step 2: Replace the book-shelf JSX block**

Still in `SpeakerDetailPage.jsx`. Find the block starting at line 539 with the comment `{/* DEV-ONLY: 3D book shelf for authors. ... */}` and ending at the `)}` on line 586.

Replace the entire block (the 4-line comment plus the `{import.meta.env.DEV && SPEAKER_BOOKS[speaker.id] && ( ... )}` JSX) with:

```jsx
{speaker.books?.length > 0 && (
  <motion.div
    className="book-shelf"
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.6, ease: EASE }}
  >
    <h3 className="book-shelf__title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      Books by {speaker.name}
    </h3>

    <div className="book-shelf__stage">
      <div className="book-shelf__books">
        {speaker.books.map((book, i) => (
          <div
            key={i}
            className="book"
            aria-label={`${book.title} by ${speaker.name}`}
          >
            <div className="book__stage">
              <img
                className="book__front"
                src={book.coverUrl}
                alt=""
                loading="lazy"
              />
              <div
                className="book__spine"
                aria-hidden="true"
                style={{ '--cover': `url(${book.coverUrl})` }}
              >
                <span className="book__spine-text">{book.title}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="book-shelf__board" aria-hidden="true" />
      <div className="book-shelf__board-shadow" aria-hidden="true" />
    </div>
  </motion.div>
)}
```

Key differences from the original: condition is `speaker.books?.length > 0` (no DEV gate, no static lookup); each `.book` has no inline `--bc1`/`--bc2` style (the cover image is the colour now); inside `.book__stage`, the `<div className="book__front">` with all its inner `<div>`s is replaced by a single `<img className="book__front">` (alt is empty because the title is repeated on the spine and the wrapping `aria-label` already describes the book to screen readers); the `.book__spine` carries `--cover` as a CSS custom property pointing at the same URL.

- [ ] **Step 3: Update the CSS**

Open `src/pages/SpeakerDetailPage.css`. Several rule blocks need surgery — make these edits in order.

**`.book` (line 1279) — shrink dimensions, add `--cover` default**

Replace:

```css
.book {
  --w: 180px;
  --h: 260px;
  --d: 30px;
  width: var(--w);
  height: var(--h);
  position: relative;
}
```

with:

```css
.book {
  --w: 130px;
  --h: 190px;
  --d: 22px;
  --cover: none;
  width: var(--w);
  height: var(--h);
  position: relative;
}
```

**`.book__front` (line 1302) — convert to img styles**

Replace the entire existing rule (lines 1302-1317):

```css
.book__front {
  position: absolute;
  inset: 0;
  transform: translateZ(calc(var(--d) / 2));
  background: linear-gradient(135deg, var(--bc1), var(--bc2));
  border-radius: 1px 3px 3px 1px;
  padding: 26px 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #ffffff;
  box-shadow:
    0 30px 40px -20px rgba(0, 0, 0, 0.55),
    0 12px 24px -12px rgba(0, 0, 0, 0.35),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}
```

with:

```css
.book__front {
  position: absolute;
  inset: 0;
  transform: translateZ(calc(var(--d) / 2));
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 1px 3px 3px 1px;
  display: block;
  box-shadow:
    0 30px 40px -20px rgba(0, 0, 0, 0.55),
    0 12px 24px -12px rgba(0, 0, 0, 0.35),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}
```

The `<img>` no longer needs padding, flex, or text colour. `object-fit: cover` ensures non-square covers fill the rectangle without distortion. Box-shadow stays — it's what gives the book physical depth.

**`.book__title`, `.book__subtitle`, `.book__author` (lines 1319-1347) — DELETE**

Delete all three rules entirely (`.book__title { ... }`, `.book__subtitle { ... }`, `.book__author { ... }`). They styled text overlays that no longer exist.

**`.book__spine` (line 1349) — image-derived background**

Replace the existing rule (lines 1349-1369):

```css
.book__spine {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--d);
  height: 100%;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--bc1), black 10%),
    color-mix(in srgb, var(--bc2), black 25%)
  );
  transform: rotateY(-90deg) translateZ(calc(var(--d) / 2));
  transform-origin: top left;
  box-shadow:
    inset 1px 0 0 rgba(255, 255, 255, 0.06),
    inset -1px 0 0 rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
```

with:

```css
.book__spine {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--d);
  height: 100%;
  background-color: #1a1a1a;
  background-image: var(--cover);
  background-size: auto 100%;
  background-position: left center;
  background-repeat: no-repeat;
  filter: brightness(0.35) saturate(0.7);
  transform: rotateY(-90deg) translateZ(calc(var(--d) / 2));
  transform-origin: top left;
  box-shadow:
    inset 1px 0 0 rgba(255, 255, 255, 0.06),
    inset -1px 0 0 rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
```

`background-color: #1a1a1a` is a fallback for when the cover image hasn't loaded yet. `background-image: var(--cover)` reads the inline-style URL set on the spine div. `filter: brightness(0.35) saturate(0.7)` darkens and desaturates the cover sample — this is how each spine gets a tone derived from its own cover without needing per-book colour data.

Note: the `filter` will also darken the spine text. The text already uses `rgba(255, 255, 255, 0.7)` which has enough contrast against the darkened spine to remain legible — verify visually in step 7.

**`@supports not (color: color-mix(...))` (line 1383) — DELETE**

This fallback referenced `var(--bc2)` which no longer exists. Delete the whole block:

```css
@supports not (color: color-mix(in srgb, red, blue)) {
  .book__spine {
    background: var(--bc2);
  }
}
```

**Mobile dimensions (line 1389) — shrink**

Replace inside the `@media (max-width: 768px)` block:

```css
  .book {
    --w: 140px;
    --h: 200px;
    --d: 24px;
  }
```

with:

```css
  .book {
    --w: 100px;
    --h: 145px;
    --d: 18px;
  }
```

**Inside the same `@media` block — DELETE the `.book__title` and `.book__subtitle` overrides** (the rules under `@media (max-width: 768px)` that still reference these now-deleted classes). Find:

```css
  .book__title {
    font-size: 16px;
  }

  .book__subtitle {
    font-size: 10px;
  }
```

and delete both. Do not delete `.book-shelf__books`, `.book-shelf__title`, `.book__stage`, or `.book:hover .book__stage` — those still apply.

- [ ] **Step 4: Restart the Vite dev server (if needed)**

If `npm run dev` is already running, Vite should hot-reload. If not:

```bash
npm run dev
```

(The Express server should already be running from Task 1; it does not need restarting for frontend changes.)

- [ ] **Step 5: Visual smoke test — author speakers**

Open the browser. Visit each of the 7 author-speaker pages and confirm books render with real covers, the 3D rotation looks right (28° resting, hover opens to ~6°), and the shelf board appears below:

- http://localhost:3000/speakers/steven-bartlett (2 books expected)
- http://localhost:3000/speakers/nir-eyal (2 books)
- http://localhost:3000/speakers/vanessa-van-edwards (2 books)
- http://localhost:3000/speakers/davina-mccall (2 books — the manual ones)
- http://localhost:3000/speakers/paul-c-brunson (1 book)
- http://localhost:3000/speakers/evy-poumpouras (1 book)
- http://localhost:3000/speakers/vonda-wright (3 books)

Look for: covers fill the front cleanly, no broken-image icons, spine darkens visibly relative to front, hover animates smoothly, no console errors.

- [ ] **Step 6: Visual smoke test — non-author speakers**

Visit two non-author speaker pages. Confirm NO shelf section renders:

- http://localhost:3000/speakers/harry-stebbings
- http://localhost:3000/speakers/jordan-schwarzenberger

Expected: bio appears as normal but no "Books by …" heading or 3D book rendering. The shelf condition (`speaker.books?.length > 0`) is correctly absent.

- [ ] **Step 7: Mobile viewport check**

Open Chrome DevTools, toggle device toolbar (Cmd-Shift-M), pick iPhone 14 Pro (390 × 844). Visit Steven Bartlett's page. Expected: books appear at 100×145, two books fit on a row comfortably, no horizontal overflow.

- [ ] **Step 8: Run regression suite**

```bash
npm test
```

Expected: still passing.

- [ ] **Step 9: Commit**

```bash
git add src/pages/SpeakerDetailPage.jsx src/pages/SpeakerDetailPage.css
git commit -m "render real book covers in 3D shelf on speaker pages"
```

---

## Task 6: Production deploy

Push to main, redeploy Cloud Run. Migration auto-applies on container start. Smoke-test in production.

- [ ] **Step 1: Push to remote**

```bash
git push origin main
```

- [ ] **Step 2: Redeploy Cloud Run**

```bash
gcloud run deploy flight-speakers-api --source . --region europe-west2 --project flight-speakers --quiet
```

Wait for the new revision to deploy (~3-5 minutes). The output ends with `Service [flight-speakers-api] revision [flight-speakers-api-XXXXX-XXX] has been deployed`.

- [ ] **Step 3: Verify migration applied in prod**

Tail recent Cloud Run logs to confirm the migration ran:

```bash
gcloud run services logs read flight-speakers-api --region europe-west2 --project flight-speakers --limit 30 | grep -i "migration"
```

Expected: a recent `Migrations applied` line. If you see `[migrations] attempt N failed`, the retry-with-backoff catches transient cold-start issues — wait for the eventual success line. If after 5 retries it still fails, investigate before declaring done.

- [ ] **Step 4: Smoke-test production**

Hit the production API for one author speaker:

```bash
curl -s https://flight-speakers-api-516196678853.europe-west2.run.app/api/speakers/steven-bartlett | jq '.books'
```

Expected: the books array with both Steven Bartlett titles.

Open the production frontend and visit a few pages:
- https://www.flightspeakers.com/speakers/steven-bartlett (or whatever the production domain is — check Vercel)
- https://www.flightspeakers.com/speakers/davina-mccall
- https://www.flightspeakers.com/speakers/harry-stebbings (no shelf expected)

Confirm covers render and the layout looks identical to local.

- [ ] **Step 5: Done**

Plan complete. If any cover looks bad in production (low-resolution, off-brand), follow up by:
1. Replacing the local image at `tmp/manual-covers/<speaker>/<slug>.jpg` (or finding a different `openLibraryCoverId`).
2. Re-running the seeder.
3. (No need to re-paste into `speakers.js` — the URL stays the same; just the GCS object content changes. Browsers will cache the old version for ~1 year per the `cacheControl` header — append a cache-buster query string to the URL in `speakers.js` if you need an immediate refresh.)

---

## Self-Review

**Spec coverage:** All sections of the design spec are addressed.
- Curated book list — Task 3 hardcodes the 13 entries with concrete OL cover IDs verified during planning.
- Data model (`{ title, coverUrl }`) — Task 2 wires the column through SPEAKER_COLUMNS; Task 5 consumes it on the frontend.
- Cover image storage (GCS bucket prefix `books/<speaker-id>/<slug>`) — Task 3 implements.
- Seeder script — Task 3.
- DB migration (`init.sql` + `migrate.js`) — Task 1.
- Seed update — Task 2.
- Frontend rendering (drop SPEAKER_BOOKS, drop DEV gate, swap markup, smaller dimensions, image-derived spine) — Task 5.
- Files Touched — table at top of plan matches the spec's table.
- Rollout — Task 6.
- Risks (low-res covers, licensing, dark covers) — addressed in Task 4 step 2 commentary and Task 5 step 5 visual check; no proactive code for `spineColor` override per spec ("not building it preemptively").

**Type/name consistency:** `book.coverUrl` is consistent across queries.js, speakers.js, the JSX, and the script output. The CSS `--cover` custom property is set in JSX and consumed in the `.book__spine` rule. The `books` column name matches across schema, queries, seed, data file, and frontend.

**Placeholders:** No TBDs, no "implement later" stubs. The Davina manual-cover paths are concrete (`tmp/manual-covers/davina-mccall/<slug>.jpg`); the user is responsible for sourcing the image, but the path and step are explicit.

**Out-of-scope items remain out of scope:** No admin UI, no per-book hover, no spineColor override, no scheduled refresh.
