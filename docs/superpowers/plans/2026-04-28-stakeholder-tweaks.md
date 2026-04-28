# Stakeholder Tweaks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply 8 stakeholder UX/accessibility/admin tweaks to the Flight Speakers site, in isolated commits.

**Architecture:** Surgical changes across CSS tokens, search ranking, search results layout, enquiry success screen, review step, speaker profile, and a new admin "boost notes" field that feeds into Claude's ranking prompt and Voyage embeddings without exposing to users.

**Tech Stack:** React 18, Vite, Framer Motion, Express 5, PostgreSQL 16 + pgvector, Claude API, Voyage embeddings, Vitest.

**Spec:** `docs/superpowers/specs/2026-04-28-stakeholder-tweaks-design.md`

---

## Task 1: Light theme contrast

**Files:**
- Modify: `src/styles/index.css:43-53` (`:root` semantic text tokens)

- [ ] **Step 1: Update light-theme text token mappings**

In `src/styles/index.css`, replace the semantic text mapping inside `:root` so primary/secondary/tertiary text are darker on light theme. Keep the underlying named palette untouched.

```css
  /* Text */
  --color-text-primary: #000000;
  --color-text-secondary: #1A1A1A;
  --color-text-tertiary: #404040;
  --color-text-muted: var(--color-gray-400);
  --color-text-inverse: var(--color-white);
```

(Replaces the four lines that currently use `var(--color-charcoal)`, `var(--color-gray-700)`, `var(--color-gray-500)`, etc.)

- [ ] **Step 2: Verify visually in browser**

Run `npm run dev:all`. Toggle to light theme via the theme toggle in the header. Visit `/`, `/speakers`, `/speakers/steven-bartlett`, `/search?q=AI%20keynote`. Body copy should look near-black, not grey.

- [ ] **Step 3: Verify dark theme still looks right**

Toggle back to dark theme on the same pages. Text should look unchanged from before (light/cream on dark backgrounds).

- [ ] **Step 4: Commit**

```bash
git add src/styles/index.css
git commit -m "improve light theme text contrast for accessibility"
```

---

## Task 2: Sort search results by matchScore

**Files:**
- Modify: `server/services/claude.js` (two spots: `vectorRetrieveThenRerank` ~line 156, full-speaker fallback ~line 228)

- [ ] **Step 1: Add a sort helper**

In `server/services/claude.js`, add a small helper near the top of the file (after the cache helpers, before `buildSpeakerSummaries`):

```js
function sortIdsByScoreDesc(ids, scores) {
  return [...ids].sort((a, b) => {
    const sa = typeof scores[a] === 'number' ? scores[a] : -Infinity
    const sb = typeof scores[b] === 'number' ? scores[b] : -Infinity
    return sb - sa
  })
}
```

- [ ] **Step 2: Apply sort in `vectorRetrieveThenRerank`**

Inside `vectorRetrieveThenRerank`, after the loop populating `matchedIds`/`reasonings`/`scores` and before `if (matchedIds.length === 0)`, add:

```js
  const sortedIds = sortIdsByScoreDesc(matchedIds, scores)
```

Then change the speaker mapping to iterate `sortedIds` instead of `matchedIds`:

```js
  const speakers = sortedIds
    .map(id => {
      const s = candidateMap.get(id)
      if (!s) return null
      const { distance, ...speaker } = s
      return speaker
    })
    .filter(Boolean)
    .slice(0, limit)
```

- [ ] **Step 3: Apply sort in full-speaker fallback**

In `semanticSearch`, after the `for (const match of result.matches)` loop populating `matchedIds` and before `if (matchedIds.length === 0)`, add:

```js
    matchedIds = sortIdsByScoreDesc(matchedIds, scores)
```

(`matchedIds` is already declared with `let`, so reassignment works.)

- [ ] **Step 4: Manual verification**

Restart the server (`npm run server`). Hit `/api/search?q=women%20in%20business%20conference&limit=8`. Open the JSON response. Verify `scores[speakers[0].id] >= scores[speakers[1].id] >= ...` for every adjacent pair.

- [ ] **Step 5: Commit**

```bash
git add server/services/claude.js
git commit -m "sort semantic search results by matchScore desc"
```

---

## Task 3: Reduce results page whitespace

**Files:**
- Modify: `src/pages/SearchResultsPage.css`

- [ ] **Step 1: Inspect current padding**

Read `src/pages/SearchResultsPage.css` and locate the `.search-hero` rule and the `.search-results` (or `.section.search-results`) rule. Note the current vertical padding values.

- [ ] **Step 2: Tighten padding when query is present**

Within `src/pages/SearchResultsPage.css`, reduce vertical padding for `.search-hero` (the non-`--full` state). A reasonable change: cut `padding-top` and `padding-bottom` by ~50%. Add or update a `.search-hero:not(.search-hero--full)` rule if needed so the empty state (`--full`) is unaffected.

Also reduce the top padding on the results section itself (`.section.search-results` or equivalent) so the gap between hero and grid feels close.

- [ ] **Step 3: Verify visually**

Run `npm run dev:all`. Visit `/search?q=AI%20keynote%20for%20tech%20leadership`. The hero should sit close to the results grid. Then visit `/search` (no query) — the empty state should still feel generous.

- [ ] **Step 4: Commit**

```bash
git add src/pages/SearchResultsPage.css
git commit -m "tighten search results layout to reduce whitespace"
```

---

## Task 4: Refine-search nudge

**Files:**
- Modify: `src/pages/SearchResultsPage.jsx`
- Modify: `src/pages/SearchResultsPage.css`

- [ ] **Step 1: Add dismissable nudge state**

In `SearchResultsPage`, add state at the top of the component (alongside `isLoading`):

```jsx
  const [showRefineHint, setShowRefineHint] = useState(true)
```

- [ ] **Step 2: Render the nudge above results header**

Inside the `<motion.div key="results">`, immediately above `<div className="search-results__header">`, add:

```jsx
{showRefineHint && results.speakers.length > 0 && (
  <motion.button
    type="button"
    className="search-results__refine-hint"
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: EASE }}
    onClick={() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      searchBarRef.current?.focus()
      setShowRefineHint(false)
    }}
  >
    <span>Not quite right? Add more detail to your brief</span>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7H11.5M11.5 7L7 2.5M11.5 7L7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </motion.button>
)}
```

- [ ] **Step 3: Add the CSS**

Append to `src/pages/SearchResultsPage.css`:

```css
.search-results__refine-hint {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 0.55rem 1rem;
  margin-bottom: var(--space-6);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background var(--duration-fast), color var(--duration-fast);
}

.search-results__refine-hint:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}
```

- [ ] **Step 4: Verify**

Run `npm run dev:all`. Search something. Click the nudge → the page scrolls to top, the search bar gains focus, and the nudge disappears.

- [ ] **Step 5: Commit**

```bash
git add src/pages/SearchResultsPage.jsx src/pages/SearchResultsPage.css
git commit -m "add refine-search nudge above results"
```

---

## Task 5: Speaker location on profile

**Files:**
- Modify: `src/pages/SpeakerDetailPage.jsx` (VideoHero variant + non-video hero)
- Modify: `src/pages/SpeakerDetailPage.css`
- Modify: `server/data/speakers.js` (fill missing locations)

- [ ] **Step 1: Verify which speakers have a location set**

Run:
```bash
grep -n "location:" "/Users/diana.veletian/Documents/Project Archive/flight-speakers-website/server/data/speakers.js"
```
Note any speakers without a location. Add a plausible `location: 'City, Country'` to each missing one (e.g. `Steven Bartlett` → `London, UK`, `Vanessa Van Edwards` → `Austin, USA`). Use real public knowledge or sensible defaults.

- [ ] **Step 2: Re-seed the dev DB**

Run:
```bash
npm run db:seed
```

This upserts the speaker rows so existing dev DBs pick up the new location values.

- [ ] **Step 3: Render location in the VideoHero**

In `src/pages/SpeakerDetailPage.jsx` `VideoHero` component, immediately after the headline element (currently `<p>... {speaker.headline}</p>` around line 104), add:

```jsx
{speaker.location && (
  <p className="speaker-video-hero__location">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 1.5C4.07 1.5 2.5 3.07 2.5 5C2.5 7.5 6 10.5 6 10.5S9.5 7.5 9.5 5C9.5 3.07 7.93 1.5 6 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="6" cy="5" r="1.3" fill="currentColor"/>
    </svg>
    {speaker.location}
  </p>
)}
```

- [ ] **Step 4: Render location in the non-video hero**

Find the non-video hero block in the same file (look for `speaker-hero__headline` around line 442). Immediately after the headline `<p>`, add an identical block but with class `speaker-hero__location`.

- [ ] **Step 5: Add CSS**

Append to `src/pages/SpeakerDetailPage.css`:

```css
.speaker-video-hero__location,
.speaker-hero__location {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}
```

- [ ] **Step 6: Verify visually**

Visit `/speakers/steven-bartlett`, `/speakers/davina-mccall`, etc. Each should show the location pin + city below the headline.

- [ ] **Step 7: Commit**

```bash
git add src/pages/SpeakerDetailPage.jsx src/pages/SpeakerDetailPage.css server/data/speakers.js
git commit -m "show speaker location on profile pages"
```

---

## Task 6: SuccessScreen — three explicit buttons

**Files:**
- Modify: `src/components/forms/SuccessScreen.jsx`
- Modify: `src/components/forms/MultiStepEnquiryForm.css` (`.mstep-success__*` styles)

- [ ] **Step 1: Replace markup**

In `src/components/forms/SuccessScreen.jsx`, remove `showShareMenu` state and the `setShowShareMenu` calls. Replace the entire `.mstep-success__actions` block with three plain buttons:

```jsx
<motion.div
  className="mstep-success__actions"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.4, delay: 1, ease: EASE }}
>
  <Link to="/" className="mstep-success__action">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12L12 4L21 12M5 10V20H19V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    Home
  </Link>

  {speaker && (
    <>
      <button
        type="button"
        className="mstep-success__action"
        onClick={handleDownload}
        disabled={generating}
      >
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1v9M3.5 6.5L7 10l3.5-3.5M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {generating ? 'Generating...' : 'Download PDF'}
      </button>

      <button
        type="button"
        className="mstep-success__action"
        onClick={handleShareEmail}
      >
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        Share via Email
      </button>
    </>
  )}
</motion.div>
```

Also remove the `setShowShareMenu(false)` calls inside `handleDownload` and `handleShareEmail` (the menu no longer exists).

- [ ] **Step 2: Update CSS for three-button row**

Locate `.mstep-success__actions` in `src/components/forms/MultiStepEnquiryForm.css`. Replace its rule and add a `.mstep-success__action` rule:

```css
.mstep-success__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: var(--space-8);
}

.mstep-success__action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background var(--duration-fast), color var(--duration-fast), border-color var(--duration-fast);
}

.mstep-success__action:hover {
  background: var(--color-text-primary);
  color: var(--color-bg-primary);
  border-color: var(--color-text-primary);
}

.mstep-success__action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .mstep-success__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
```

Remove the now-unused `.mstep-success__action-btn`, `.mstep-success__share-wrap`, `.mstep-success__share-menu`, `.mstep-success__share-option` rules.

- [ ] **Step 3: Verify**

Run `npm run dev:all`. Submit a test enquiry from `/enquiry/steven-bartlett` end-to-end. On the success screen, all three buttons should be visible. Click Download PDF → file downloads. Click Share via Email → mailto opens. Click Home → returns to `/`.

- [ ] **Step 4: Commit**

```bash
git add src/components/forms/SuccessScreen.jsx src/components/forms/MultiStepEnquiryForm.css
git commit -m "show home, download, and share as explicit buttons on success screen"
```

---

## Task 7: Selected-speaker cards in review step

**Files:**
- Modify: `src/components/forms/steps/StepReview.jsx`
- Modify: `src/components/forms/MultiStepEnquiryForm.css` (`.mstep-review__*` styles)

- [ ] **Step 1: Locate where the primary speaker is passed in**

Read `src/components/forms/MultiStepEnquiryForm.jsx` and `src/hooks/useMultiStepForm.js` to confirm how the primary speaker is plumbed into `StepReview`. Note the prop name (likely `primarySpeaker` or part of `formData`). If `StepReview` does not currently receive it, add a `primarySpeaker` prop and pass it through `MultiStepEnquiryForm.jsx`.

- [ ] **Step 2: Build the selected-speakers list inside StepReview**

In `src/components/forms/steps/StepReview.jsx`, near the top of the function body (after the existing `selectedIds` line), add:

```jsx
  // Build the visible selected-speakers list: primary first, then any AI-recommended toggles.
  const allRecommended = recommendedSpeakers || []
  const selectedFromRecs = allRecommended.filter(s => selectedIds.includes(s.id))
  const seen = new Set()
  const visibleSpeakers = []
  if (primarySpeaker) {
    visibleSpeakers.push(primarySpeaker)
    seen.add(primarySpeaker.id)
  }
  for (const s of selectedFromRecs) {
    if (!seen.has(s.id)) {
      visibleSpeakers.push(s)
      seen.add(s.id)
    }
  }
```

Add `primarySpeaker` to the function signature destructure with a default of `null`.

- [ ] **Step 3: Render the speaker cards block**

Insert this block inside `.mstep-review`, right after the `.mstep-review__grid` block and before the existing recs blocks (`recommendedSpeakers.length === 0 && !formData.brief && ...`):

```jsx
{visibleSpeakers.length > 0 && (
  <motion.div
    className="mstep-review__selected"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.05, duration: 0.4, ease: EASE }}
  >
    <div className="mstep-review__selected-header">
      Speakers in your enquiry ({visibleSpeakers.length})
    </div>
    <ul className="mstep-review__selected-list">
      {visibleSpeakers.map((s) => {
        const isPrimary = primarySpeaker && s.id === primarySpeaker.id
        return (
          <li key={s.id} className="mstep-review__selected-card">
            <img src={s.photo} alt={s.name} className="mstep-review__selected-photo" />
            <div className="mstep-review__selected-info">
              <span className="mstep-review__selected-name">{s.name}</span>
              <span className="mstep-review__selected-headline">{s.headline}</span>
              {s.topics?.length > 0 && (
                <span className="mstep-review__selected-topics">
                  {s.topics.slice(0, 3).join(' / ')}
                </span>
              )}
            </div>
            {!isPrimary && onToggleSpeaker && (
              <button
                type="button"
                className="mstep-review__selected-remove"
                onClick={() => onToggleSpeaker(s.id)}
                aria-label={`Remove ${s.name}`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </li>
        )
      })}
    </ul>
  </motion.div>
)}
```

- [ ] **Step 4: Add CSS**

Append to `src/components/forms/MultiStepEnquiryForm.css`:

```css
.mstep-review__selected {
  margin-top: var(--space-6);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

.mstep-review__selected-header {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 0.75rem;
}

.mstep-review__selected-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.mstep-review__selected-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem;
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
}

.mstep-review__selected-photo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.mstep-review__selected-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.mstep-review__selected-name {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text-primary);
}

.mstep-review__selected-headline {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mstep-review__selected-topics {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: 0.15rem;
}

.mstep-review__selected-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  flex-shrink: 0;
}

.mstep-review__selected-remove:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}
```

- [ ] **Step 5: Verify all three entry paths**

Run `npm run dev:all`. Walk through:
1. `/enquiry/steven-bartlett` → fill form → review step shows Steven as the primary card (no remove button).
2. `/search?q=AI%20keynote` → select 2 speakers → "Submit This Brief" → review step shows both cards with remove buttons.
3. `/enquiry` → review step with no speakers should not render the block (`visibleSpeakers.length === 0`).

- [ ] **Step 6: Commit**

```bash
git add src/components/forms/steps/StepReview.jsx src/components/forms/MultiStepEnquiryForm.css src/components/forms/MultiStepEnquiryForm.jsx src/hooks/useMultiStepForm.js
git commit -m "show selected speaker cards on review step"
```

(Only stage the files you actually changed in steps 1-3.)

---

## Task 8: Admin AI boost notes per speaker

This is the largest task. Five sub-parts: schema, queries, draft flow, Claude prompt + embeddings, admin form. Test the prompt-building unit before commit so the wiring is verified.

**Files:**
- Modify: `server/db/init.sql`
- Modify: `server/db/migrate.js`
- Modify: `server/db/queries.js`
- Modify: `server/db/draft-queries.js`
- Modify: `server/routes/speakers.js`
- Modify: `server/routes/admin/speakers.js`
- Modify: `server/services/claude.js`
- Modify: `server/services/embeddings.js`
- Modify: `src/admin/components/SpeakerForm.jsx`
- Modify: `src/admin/admin.css`
- Create: `server/services/claude.test.js`

### 8a — Schema

- [ ] **Step 1: Update init.sql**

In `server/db/init.sql`, locate the `CREATE TABLE IF NOT EXISTS speakers (...)` block. Add `boost_notes TEXT,` immediately after the `embedding vector(1024),` line.

- [ ] **Step 2: Add idempotent migration**

In `server/db/migrate.js`, inside `applyMigrations`, append:

```js
  await pool.query(`
    ALTER TABLE speakers ADD COLUMN IF NOT EXISTS boost_notes TEXT;
  `)
```

- [ ] **Step 3: Apply migration to local DB**

```bash
docker exec flight-speakers-db psql -U postgres -d flightspeakers -c "ALTER TABLE speakers ADD COLUMN IF NOT EXISTS boost_notes TEXT;"
```

(Or restart Express, which runs `migrate.js` on boot.)

Verify:
```bash
docker exec flight-speakers-db psql -U postgres -d flightspeakers -c "\\d speakers" | grep boost_notes
```

- [ ] **Step 4: Commit**

```bash
git add server/db/init.sql server/db/migrate.js
git commit -m "add boost_notes column to speakers table"
```

### 8b — Queries (read + persist)

- [ ] **Step 5: Update SELECT lists in queries.js**

In `server/db/queries.js`, find `getAllSpeakers`, `getSpeakerById`, `getSpeakerProfilesForSearch`, and the SELECT inside `vectorSearch`. Add `boost_notes AS "boostNotes"` (with the camelCase alias to match other fields like `feeMin`) to each SELECT list.

- [ ] **Step 6: Persist boost_notes in createSpeaker / updateSpeaker**

In the same file, locate `createSpeaker`. Add `boost_notes` to the INSERT column list and bind to `data.boostNotes ?? null`.

In `updateSpeaker`, add a setter clause `boost_notes = COALESCE($N, boost_notes)` (or however the existing fields are conditionally updated — match the existing pattern). Bind to `data.boostNotes`.

- [ ] **Step 7: Strip boost_notes from public route responses**

In `server/routes/speakers.js`, the public `GET /api/speakers/:id` and `GET /api/speakers` handlers should NOT return `boost_notes` to the client. Find where speaker objects are sent in the response and `delete` the `boostNotes` key (or omit via destructuring). Add a comment:

```js
// SECURITY/UX INVARIANT: boost_notes is admin-only context for AI search ranking.
// Never expose to public clients.
```

- [ ] **Step 8: Commit**

```bash
git add server/db/queries.js server/routes/speakers.js
git commit -m "read and persist boost_notes; strip from public responses"
```

### 8c — Draft flow

- [ ] **Step 9: Carry boost_notes through draft approval**

Read `server/db/draft-queries.js`. The `approveDraft` function calls `createSpeaker` / `updateSpeaker` with the draft's JSONB data. Confirm `boostNotes` flows through transparently (since the data column is JSONB the field arrives automatically — but verify by tracing).

If the approve flow extracts a fixed list of fields, add `boostNotes` to the list. Same for any code path that snapshots an existing speaker into a draft.

- [ ] **Step 10: Commit**

```bash
git add server/db/draft-queries.js
git commit -m "include boost_notes in draft approve flow"
```

### 8d — Claude prompt + embeddings

- [ ] **Step 11: Write a unit test for buildSpeakerSummaries**

Create `server/services/claude.test.js`:

```js
import { describe, it, expect } from 'vitest'

// buildSpeakerSummaries is currently not exported. We'll export it for testing
// (pure helper — safe to expose). Reuse the same import path your code uses.
import { _internal } from './claude.js'

describe('buildSpeakerSummaries', () => {
  it('omits the Internal Notes line when boost_notes is empty', () => {
    const out = _internal.buildSpeakerSummaries([
      { id: 's1', name: 'Test', headline: 'h', bio: 'b', topics: ['t'] },
    ])
    expect(out).not.toContain('Internal Notes')
  })

  it('includes the Internal Notes line when boost_notes is present', () => {
    const out = _internal.buildSpeakerSummaries([
      {
        id: 's1', name: 'Test', headline: 'h', bio: 'b', topics: ['t'],
        boostNotes: 'Has delivered 3 health-focused keynotes',
      },
    ])
    expect(out).toContain('Internal Notes (for AI consideration): Has delivered 3 health-focused keynotes')
  })
})
```

- [ ] **Step 12: Run the test — it should fail**

```bash
npm test -- server/services/claude.test.js
```

Expected: FAIL — `buildSpeakerSummaries` is not exported, or the Internal Notes line is missing.

- [ ] **Step 13: Update buildSpeakerSummaries and export it**

In `server/services/claude.js`, inside `buildSpeakerSummaries`'s `parts.push` block, after the `Location:` push, add:

```js
    if (s.boostNotes && s.boostNotes.trim()) {
      parts.push(`   Internal Notes (for AI consideration): ${s.boostNotes.trim()}`)
    }
```

At the bottom of the file, export an `_internal` namespace for testing:

```js
export const _internal = { buildSpeakerSummaries }
```

- [ ] **Step 14: Run the test again — it should pass**

```bash
npm test -- server/services/claude.test.js
```

Expected: PASS (both cases).

- [ ] **Step 15: Append boost_notes to embedding text**

In `server/services/embeddings.js`, locate `buildSpeakerText`. Append boost notes to the returned string when present:

```js
  if (speaker.boostNotes && speaker.boostNotes.trim()) {
    parts.push(`Internal notes: ${speaker.boostNotes.trim()}`)
  }
```

(Match the existing `parts` push pattern in that function.)

- [ ] **Step 16: Trigger embedding regen on draft approve**

In `server/db/draft-queries.js`, inside `approveDraft`, after the speaker create/update succeeds, if `boostNotes` was part of the draft data, call the embedding regen for that speaker. The pattern: import `generateEmbeddings` + `updateSpeakerEmbedding` and run them inline (same as `seed-embeddings.js`). This is fire-and-forget so admin UX stays fast — wrap in try/catch and log on failure.

```js
  // Regenerate embedding when content that influences search changes.
  try {
    const fresh = await getSpeakerById(speakerId)
    if (fresh) {
      const text = buildSpeakerText(fresh)
      const [embedding] = await generateEmbeddings([text])
      if (embedding) await updateSpeakerEmbedding(speakerId, embedding)
    }
  } catch (err) {
    console.error('[draft approve] embedding regen failed:', err.message)
  }
```

(Add the imports at the top of the file. If `getSpeakerById` returns the speaker with `boostNotes`, this picks them up automatically.)

- [ ] **Step 17: Commit**

```bash
git add server/services/claude.js server/services/claude.test.js server/services/embeddings.js server/db/draft-queries.js
git commit -m "feed boost_notes into Claude prompt and embeddings"
```

### 8e — Admin form UI

- [ ] **Step 18: Add the textarea field**

In `src/admin/components/SpeakerForm.jsx`, find the bottom of the form fields (just before the submit row). Add:

```jsx
<div className="speaker-form__divider" aria-hidden="true" />

<div className="speaker-form__field speaker-form__field--internal">
  <label htmlFor="boostNotes">
    <span className="speaker-form__lock-icon" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <rect x="3" y="5" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M4.5 5V3.5a1.5 1.5 0 1 1 3 0V5" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    </span>
    AI Boost Notes (internal — not shown to users)
  </label>
  <textarea
    id="boostNotes"
    name="boostNotes"
    rows={3}
    value={formData.boostNotes || ''}
    onChange={handleChange}
    placeholder="e.g. Has delivered 3 health-focused keynotes; Especially strong with C-suite audiences"
  />
  <small className="speaker-form__help">
    Hidden context that influences AI search ranking. Soft signal, not a hard filter.
  </small>
</div>
```

Make sure `formData` includes `boostNotes` as a tracked field — match how the existing fields are listed in the form's initial state.

- [ ] **Step 19: Add CSS**

Append to `src/admin/admin.css`:

```css
.speaker-form__divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--space-6) 0 var(--space-4);
}

.speaker-form__field--internal label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-secondary);
}

.speaker-form__lock-icon {
  display: inline-flex;
  color: var(--color-text-tertiary);
}

.speaker-form__help {
  display: block;
  margin-top: 0.4rem;
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
}
```

- [ ] **Step 20: End-to-end verification**

1. Log into `/admin`. Edit a speaker. Add boost notes ("Has delivered 3 health-focused keynotes"). Save → creates draft.
2. Approve the draft from `/admin/review`.
3. Hit `GET /api/speakers/:id` (the public route) — confirm `boostNotes` is NOT in the response JSON. Use:
   ```bash
   curl -s http://localhost:3001/api/speakers/<id> | grep -i boost
   ```
   Expected: no output.
4. Run a search: `curl -s "http://localhost:3001/api/search?q=health%20keynote&limit=4"`. Confirm reasonable ranking (the test speaker should rank higher for health queries).
5. Confirm `npm test` still passes.

- [ ] **Step 21: Commit**

```bash
git add src/admin/components/SpeakerForm.jsx src/admin/admin.css
git commit -m "add admin AI boost notes field to speaker form"
```

---

## Final verification

- [ ] **Step 22: Run the full test suite**

```bash
npm test
```

Expected: all tests pass (existing schema tests + new claude test).

- [ ] **Step 23: Walk the public site once**

Visit each of these in the browser and check nothing regressed:
- `/` (home, light + dark)
- `/speakers` (grid)
- `/speakers/steven-bartlett` (location visible, light theme readable)
- `/search?q=women%20in%20business` (results sorted, refine nudge visible, layout tight)
- `/enquiry/steven-bartlett` → walk to review step (selected card visible) → submit → success screen (three buttons)
- `/admin/speakers/<id>/edit` (boost notes textarea visible)

- [ ] **Step 24: Final summary commit (if any housekeeping)**

If any cleanup commits emerged (CSS dead code, stray imports), ensure they're committed. Otherwise nothing to do.
