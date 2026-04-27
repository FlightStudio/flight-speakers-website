# Speaker Books Shelf — Design

**Date:** 2026-04-27
**Status:** Approved
**Owner:** Diana Veletian

## Goal

Replace the dev-only CSS-gradient book placeholder on the speaker detail page with a production 3D shelf showing every speaker's published books with real cover artwork. Ship to production for all 7 author-speakers.

## Context

`src/pages/SpeakerDetailPage.jsx:12-28` currently holds a hardcoded `SPEAKER_BOOKS` lookup with three speakers (Steven Bartlett, Nir Eyal, Vanessa Van Edwards) and two books each. The shelf renders a CSS-only 3D book — a `rotateY(-28deg)` rectangle with a gradient front, a gradient spine, an oak-coloured shelf board, and a hover state that opens the book toward the viewer. The whole section is gated on `import.meta.env.DEV` so it never renders in production.

Per the conversation, we're keeping the 3D treatment, swapping the gradient cover for the real cover image, expanding to all 7 authoring speakers, and making the books slightly smaller because real photos carry more visual weight than flat gradients.

## Curated Book List

Sourced from Open Library where available, supplemented manually from publisher product pages where Open Library coverage is incomplete.

| Speaker | Books | Source |
|---|---|---|
| Steven Bartlett | The Diary of a CEO (2023); Happy Sexy Millionaire (2021) | Open Library |
| Nir Eyal | Hooked (2014); Indistractable (2019) | Open Library |
| Vanessa Van Edwards | Captivate (2017); Cues (2022) | Open Library |
| Davina McCall | Menopausing (2022); Lessons for Survival (2024) | Manual (publisher) |
| Paul C Brunson | It's Complicated But It Doesn't Have To Be (2012) | Open Library |
| Evy Poumpouras | Becoming Bulletproof (2020) | Open Library |
| Dr Vonda Wright | Fitness After 40 (2015); Younger in 8 Weeks (2016); Dr Vonda Wright's Guide to Thrive (2011) | Open Library |

Six speakers (Jordan Schwarzenberger, Harry Stebbings, Nischa Shah, Maggie Sellers, Paul Scanlon, Dr Kristen Holmes) have no published books and don't get a shelf. The shelf section is conditional on `speaker.books?.length > 0`, so their detail pages render unchanged.

Vonda Wright's *Masterful Care of the Aging Athlete* (a clinical reference textbook) is excluded per user direction.

## Architecture

### Data model

Add a JSONB `books` column to the `speakers` table. Each value is an array of:

```ts
{
  title: string;       // Used for spine vertical text + aria-label
  coverUrl: string;    // GCS URL: https://storage.googleapis.com/flight-speakers-photos/books/<speaker-id>/<slug>.jpg
}
```

JSONB on `speakers` rather than a `speaker_books` join table: books are read alongside the speaker, never queried independently, and rarely change. The existing `social_profiles` and `social_stats` columns use the same JSONB-on-speakers pattern, so this is consistent.

The data model is deliberately minimal. No subtitle, no author, no spine colour — the cover image already encodes title/subtitle/author, and the spine colour is derived from the cover at render time via CSS filters (see Frontend rendering below).

### Cover image storage

All covers live in the existing GCS bucket `flight-speakers-photos`, under the prefix `books/<speaker-id>/<book-slug>.jpg`. The bucket is already public-read and already whitelisted in the CSP `imgSrc` directive (`server/index.js:36`), so no infrastructure change is needed. Covers are uploaded by the seeder script (see below).

### Seeder script

New file: `server/scripts/seed-books.js`. One-off tool, runs as `node server/scripts/seed-books.js`. The curated list is hardcoded in the file (no separate config — there are 14 entries).

For each book, the script:

1. Resolves the source: either `openLibraryCoverId` (Open Library Covers API) or `manualUrl` (direct publisher URL for Davina's books).
2. Downloads the image (Open Library: `https://covers.openlibrary.org/b/id/<id>-L.jpg`).
3. Uploads to GCS at `books/<speaker-id>/<book-slug>.jpg` using the same `@google-cloud/storage` SDK that admin photo uploads use (`server/routes/admin/_uploads.js`).
4. Logs each operation. If a downloaded image is suspiciously small (< 20 KB or width < 300 px), warn so we know to swap that book to a manual URL.
5. After all books are processed, prints a JS snippet to stdout — the `books: [...]` field per speaker — for the user to paste into `server/data/speakers.js` by hand.

Why a script vs. doing it manually: 14 books × 3 steps each is enough work to be worth automating, and re-running is the natural way to refresh a stale cover later. AST-manipulating `speakers.js` is fragile, so the script prints a snippet and the human pastes — explicit and safe.

### Database migration

The `migrate.js` startup hook gets one new statement:

```sql
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS books JSONB NOT NULL DEFAULT '[]'::jsonb;
```

`init.sql` gets the column added to its `CREATE TABLE speakers` block so fresh installs match. Both are idempotent — the migration can run repeatedly and on existing databases without harm. The retry-with-backoff wrapper around `runMigrations` (added during the prior Cloud Run cold-start fix) covers any transient connection issues during deploy.

### Seed update

`server/db/seed.js` adds `books` to the upsert. The column reads `JSON.stringify(speaker.books || [])` from the data file, mirroring the `social_profiles` treatment. `getSpeakerById` and `getAllSpeakers` (`server/db/queries.js`) gain `books` in the `SPEAKER_COLUMNS` constant so the API returns the field.

### Frontend rendering

`src/pages/SpeakerDetailPage.jsx`:

- Delete the inline `SPEAKER_BOOKS` lookup (lines 12-28).
- Drop the `import.meta.env.DEV` gate (line 542). Render conditionally on `speaker.books?.length > 0`.
- Simplify the per-book markup. The cover IS the title/subtitle/author, so the inner text overlays disappear:

```jsx
<div className="book" aria-label={`${book.title} by ${speaker.name}`}>
  <div className="book__stage">
    <img className="book__front" src={book.coverUrl} alt="" loading="lazy" />
    <div
      className="book__spine"
      aria-hidden="true"
      style={{ '--cover': `url(${book.coverUrl})` }}
    >
      <span className="book__spine-text">{book.title}</span>
    </div>
  </div>
</div>
```

`src/pages/SpeakerDetailPage.css`:

- `.book` size variables shrink from `180×260 / depth 30` to `130×190 / depth 22` (desktop) and from `140×200 / depth 24` to `100×145 / depth 18` (mobile, ≤768px). Depth stays at ~17% of width, preserving the chunky-book proportion.
- `.book__front`: drop the gradient background, padding, and flex layout. Set `width: 100%; height: 100%; object-fit: cover;` on the now-`<img>` element. The depth shadow (`box-shadow`) stays.
- `.book__spine`: replace the `color-mix` gradient with `background-image: var(--cover); background-size: auto 100%; background-position: left center; filter: brightness(0.35) saturate(0.7);`. This gives each spine a darkened, desaturated tone derived from the cover's left edge — no per-book colour data needed. The vertical title text (`book__spine-text`) stays.
- Delete `.book__title`, `.book__subtitle`, `.book__author` rules entirely.
- All other 3D mechanics — `rotateY(-28deg)` default, `rotateY(-6deg) translateZ(16px)` hover, `perspective: 1600px` on the stage, `transform-style: preserve-3d`, the shelf board, the board shadow, the reduced-motion fallback — stay exactly as-is.

The shelf section heading ("Books by {speaker.name}"), book icon SVG, and `motion.div` enter animation are unchanged.

## Files Touched

| File | Change |
|---|---|
| `server/db/init.sql` | Add `books JSONB NOT NULL DEFAULT '[]'::jsonb` to speakers CREATE TABLE |
| `server/db/migrate.js` | Add `ALTER TABLE speakers ADD COLUMN IF NOT EXISTS books ...` |
| `server/db/seed.js` | Include `books` in upsert (stringified) |
| `server/db/queries.js` | Add `books` to `SPEAKER_COLUMNS` |
| `server/data/speakers.js` | Add `books: [...]` field to 7 author-speakers |
| `server/scripts/seed-books.js` | New file — curated list, downloader, uploader, snippet printer |
| `src/pages/SpeakerDetailPage.jsx` | Remove `SPEAKER_BOOKS` and DEV gate; replace inner book markup with `<img>` cover |
| `src/pages/SpeakerDetailPage.css` | Shrink dimensions, drop overlay text rules, replace spine background, simplify front |

## Rollout

1. Run `node server/scripts/seed-books.js` locally. Cover images upload to GCS; JS snippet printed to stdout.
2. Paste snippet into `server/data/speakers.js`.
3. Restart local Express. Migration auto-applies the new column.
4. Run `npm run db:seed`. The DB picks up the books field for each speaker.
5. Smoke-test: visit `/speakers/steven-bartlett`, `/speakers/davina-mccall`, `/speakers/vonda-wright` etc. Confirm 3D shelf renders with real covers and no shelf appears for non-author speakers (e.g. `/speakers/harry-stebbings`).
6. Commit (data file + script + frontend + DB changes), push, redeploy Cloud Run. Migration runs idempotently on container start.
7. Smoke-test in production.

## Risks & Mitigations

- **Open Library cover quality is uneven.** Some covers may be low-resolution and look soft at 130×190. The seeder script logs any download under 20 KB / 300 px wide so we know which to replace manually with a publisher-sourced URL. Same path Davina's books use, so the manual fallback is already part of the design.
- **Open Library licensing is murky for commercial use.** Covers come from a mix of Internet Archive scans and publisher uploads, with rights varying book by book. In practice publishers actively want their books shown and this is unlikely to draw a complaint, but if one does, we swap that single cover for a manually-uploaded one. No infrastructure change — same `coverUrl` field, different image source.
- **Spine background filter may look weak on dark covers.** Covers that are already dark won't visibly darken under `brightness(0.35) saturate(0.7)`. If a particular spine looks flat, we can add an optional `spineColor` field on the book object as an override. Not building it preemptively — wait to see if it's actually a problem.

## Out of Scope

- Admin UI for managing books (a `speaker_books` table + CRUD form). YAGNI for ~14 entries that change rarely. Revisit if books become a frequently edited catalogue.
- Author bio per book, publisher metadata, "buy this book" links. Pure visual feature for now.
- Per-book hover behaviour beyond the existing rotateY/translateZ. The current treatment looks good and is consistent across the shelf.
- Automatic Open Library refresh on a schedule. Books are added rarely enough that re-running the seeder by hand is fine.
