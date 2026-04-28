# Stakeholder Tweaks - Design Spec

**Date:** 2026-04-28
**Source:** Stakeholder feedback batch (calendar item dropped per user)

## Goal

Apply 8 stakeholder-requested tweaks across the public site, enquiry flow, search, speaker profiles, and admin. Implement in isolated commits so any single tweak can be reverted independently.

## Implementation Order

1. Light theme contrast (CSS-only)
2. Search results ordering by matchScore
3. Reduce results page whitespace
4. Refine-search nudge on results page
5. Speaker location on profile
6. SuccessScreen - three explicit buttons
7. Selected-speaker cards in review step
8. Admin AI boost notes per speaker

Smallest/CSS changes first, then UI changes, then the DB+admin+search feature last.

---

## 1. Light theme contrast

**Problem:** Users with sight problems struggle to read low-contrast cream/grey text in light mode.

**Change:** In `src/styles/index.css` `:root` block, darken text tokens:

| Token | Before | After |
|---|---|---|
| `--color-text-primary` | `#1A1A1A` (charcoal) | `#000000` |
| `--color-text-secondary` | `#404040` (gray-700) | `#1A1A1A` |
| `--color-text-tertiary` | `#737373` (gray-500) | `#404040` |

Achieved by overriding the semantic mappings directly inside `:root`, leaving the underlying named palette (`--color-charcoal`, `--color-gray-700`, etc.) unchanged so dark theme inheritance is unaffected.

Dark theme (`[data-theme="dark"]`) is untouched.

**Verification:** Toggle light theme on home, speaker detail, search results - text should be visibly closer to black.

---

## 2. Search results ordering

**Problem:** Stakeholder reports results not consistently ordered highest-match-first.

**Root cause:** `server/services/claude.js` preserves Claude's returned order. The system prompt asks Claude to rank by relevance, but the LLM may not always emit matches strictly sorted by `matchScore`.

**Change:** After parsing Claude's response in both `vectorRetrieveThenRerank` (~line 156) and the full-speaker fallback (~line 228), sort `matchedIds` by `scores[id]` descending before mapping to speaker objects. Speakers without a numeric score sort last.

**Verification:** Run a few searches, confirm `scores[speakers[0].id] >= scores[speakers[1].id] >= ...` always holds.

---

## 3. Reduce whitespace on results page

**Problem:** Too much vertical real estate lost between hero and results when a query is present.

**Change:** In `src/pages/SearchResultsPage.css`:
- `.search-hero` (when NOT `--full`): reduce vertical padding ~50%
- `.search-results` section: reduce top padding so results sit close to the hero
- Keep `.search-hero--full` (no-query state) padding unchanged so the empty state still feels generous

**Verification:** Visual check at 1440px and 768px viewports.

---

## 4. Refine-search nudge

**Problem:** Users on results page who want to add detail don't realise the search bar at top is editable.

**Change:** In `src/pages/SearchResultsPage.jsx`, above `.search-results__header`, add a small dismissable banner:

> *"Not quite right? Add more detail to your brief →"*

Clicking calls `searchBarRef.current?.focus()` and scrolls smoothly to the top. Banner is dismissed in component state (no persistence needed - re-appears next page load).

**Verification:** Click banner, search bar at top focuses and is scrolled into view.

---

## 5. Speaker location on profile

**Problem:** Profiles don't show where a speaker is based.

**Data:** `speakers.location` already exists in the DB schema and is partially populated in `server/data/speakers.js`.

**Change:** In `src/pages/SpeakerDetailPage.jsx`, render a small meta line near the headline (in both `VideoHero` and the non-video hero variant) showing a pin icon + `speaker.location`. Hidden when location is null/empty.

For speakers in the seed file without a location, fill in plausible cities. Re-seed not strictly required (can be done via admin draft flow), but updating the seed file means fresh DB initialisations include the data.

**Verification:** Visit each speaker profile, confirm location displays and looks correct.

---

## 6. SuccessScreen - three explicit buttons

**Problem:** Home is a cryptic icon, Download PDF and Share via Email are buried in a share-menu dropdown.

**Change:** In `src/components/forms/SuccessScreen.jsx`, replace the icon-only Home button + share-menu dropdown with three labelled buttons in a horizontal row:

- `Home` (Link to `/`)
- `Download PDF` (existing `handleDownload`)
- `Share via Email` (existing `handleShareEmail`)

Loading state on PDF button stays (`Generating...`). Remove `showShareMenu` state and the `AnimatePresence` dropdown.

CSS in `src/components/forms/MultiStepEnquiryForm.css` (`.mstep-success__*` classes) updated to lay out three buttons evenly. Mobile: stack vertically below ~480px.

PDF generation is only relevant when `speaker` is provided. Without it, hide the PDF and Share buttons; Home remains.

**Verification:** Submit a test enquiry, confirm three buttons render correctly with labels and all three handlers work.

---

## 7. Selected-speaker cards in review step

**Problem:** Selected speakers only appear as small face bubbles in the progress bar - users don't recognise speakers by face alone.

**Change:** In `src/components/forms/steps/StepReview.jsx`, add a "Speakers in your enquiry" section below the field grid (above the existing AI recs section). Renders each selected speaker as a horizontal card:

- Photo (small, ~48px)
- Name + headline
- Top 2-3 topics as small chips
- Remove button (calls `onToggleSpeaker(s.id)`)

Source: combine the primary speaker (passed via `formData` / route state) with `additionalSpeakerIds` resolved against `recommendedSpeakers`. Deduplicate by id.

When no speakers are selected, show empty-state copy: *"No speakers selected. Use AI search or pick from the recommendations below."*

CSS additions in `MultiStepEnquiryForm.css` under `.mstep-review__selected*` namespace.

**Verification:** Reach review step from `/enquiry/:speakerId` (primary preselected), from `/search` (multiple selected), and from a generic `/enquiry` start (none) - each shows the right card list.

---

## 8. Admin AI boost notes per speaker

**Problem:** Admin needs to add hidden context per speaker that influences AI ranking but isn't shown to users (e.g. "Done 3 health-focused keynotes", "Strong with C-suite").

**Approach:** Boost notes are a soft signal fed into Claude's prompt - not a hard filter, not user-visible.

### Schema

- Add `boost_notes TEXT` column to `speakers` table.
- `speaker_drafts.data` JSONB already accepts arbitrary fields - no schema change needed there, but the approve flow must propagate `boost_notes` from draft to live row.

Migration: add a script `server/db/migrations/2026-04-28-add-boost-notes.sql` that runs `ALTER TABLE speakers ADD COLUMN IF NOT EXISTS boost_notes TEXT;`. For the dev Docker DB, also update `server/db/init.sql` so fresh containers get the column.

### Backend changes

`server/db/queries.js`:
- `getAllSpeakers()` - include `boost_notes` in SELECT
- `getSpeakerProfilesForSearch()` - include `boost_notes`
- `vectorSearch()` - include `boost_notes` in returned columns
- `createSpeaker()`, `updateSpeaker()` - persist `boost_notes`
- `getSpeakerById()` - include `boost_notes` (admin-only consumer; public route strips it)

**Public-API stripping:** `GET /api/speakers/:id` and `GET /api/speakers` must NOT return `boost_notes`. Strip in `server/routes/speakers.js` before sending to client. Document this in a code comment - it's a security/UX invariant.

`server/db/draft-queries.js`:
- `approveDraft()` - include `boost_notes` when creating/updating speaker from draft data

`server/services/claude.js`:
- `buildSpeakerSummaries()` - when `s.boost_notes` is present, append a line: `   Internal Notes (for AI consideration): ${s.boost_notes}`. Placed after `Location:` line. Phrasing chosen so Claude understands these are agent-curated insights, not user-stated facts.

`server/services/embeddings.js`:
- `buildSpeakerText()` - append boost notes to the text used for embedding generation. Trigger re-embedding when notes change (admin save → draft approve → enqueue embedding regen for that speaker).

### Admin UI

`src/admin/components/SpeakerForm.jsx`:
- Add a textarea field labelled **"AI Boost Notes (internal - not shown to users)"**
- Helper text: *"Hidden context that influences AI search ranking. E.g. 'Has delivered 3 health-focused keynotes', 'Especially strong with C-suite audiences', 'Trending in 2026'."*
- Placed at the bottom of the form (below user-facing fields, visually separated with a divider and small lock icon)

Speaker edits go through the existing draft review queue per `CLAUDE.md` - boost-note-only edits are also drafts.

### Verification

- Add boost notes to a test speaker via admin → approve draft → confirm `boost_notes` saved
- Confirm `GET /api/speakers/:id` does NOT include `boost_notes` in response
- Confirm `getSpeakerProfilesForSearch()` DOES include them and `buildSpeakerSummaries()` outputs the Internal Notes line
- Run a search where the boost note is the only differentiator - confirm Claude's reasoning reflects awareness of the note
- Confirm embedding regenerated after notes change

---

## Out of scope

- Calendar / Google Calendar API integration (deferred per user)
- Hard rule engine for search (option D rejected during brainstorm)
- Per-speaker hidden attributes beyond a single text field (option C rejected)

## Risks / open questions

- **Boost notes leaking to public API:** Mitigation is explicit stripping in `server/routes/speakers.js`. Add a lightweight test or a code comment flagging it as a security invariant.
- **Embedding regen cost:** Voyage API call per boost-note edit. Acceptable at current speaker volume (~13 speakers).
- **Light theme contrast on accent-coloured surfaces:** The `--color-accent` CTA buttons use white text on `#E85D4C` - already passes AA. Out of scope here, but worth a follow-up audit if the stakeholder flags more accessibility issues.
