# Speaker availability — design

_Date: 2026-04-30. Status: approved by user (high-level), pending spec review._

## Goal

Replace the faked `generateAvailability()` PRNG in `AvailabilityCalendar.jsx` with real data sourced from the speakers themselves. Speakers receive a long-lived magic link to a self-service page where they block out dates they cannot do. The enquiry form's date picker reads those blocks so clients see real availability when picking a date.

## Non-goals (v1)

- No "limited" or "tentative" state — binary blocked / available only.
- No automated reminder emails (Klaviyo cadence, monthly send).
- No public availability surface on `SpeakerDetailPage` (browsing) or search results — limited to the enquiry form for now.
- No iCal / Google Calendar sync.
- No conflict detection against existing accepted enquiries (separate concern).

## Data model

### New table — `speaker_blocked_dates`

```sql
CREATE TABLE IF NOT EXISTS speaker_blocked_dates (
    speaker_id TEXT NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (speaker_id, blocked_date)
);
CREATE INDEX IF NOT EXISTS idx_speaker_blocked_dates_speaker ON speaker_blocked_dates(speaker_id);
CREATE INDEX IF NOT EXISTS idx_speaker_blocked_dates_date ON speaker_blocked_dates(blocked_date);
```

One row per blocked day. Composite PK guarantees uniqueness. Cascading delete keeps it tidy if a speaker is removed.

### Extend `speaker_tokens`

```sql
ALTER TABLE speaker_tokens DROP CONSTRAINT speaker_tokens_type_check;
ALTER TABLE speaker_tokens ADD CONSTRAINT speaker_tokens_type_check
    CHECK (type IN ('new', 'update', 'availability'));
ALTER TABLE speaker_tokens ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
```

`'availability'` tokens behave differently from `'new'`/`'update'`:
- `expires_at` set far in the future (e.g. `NOW() + INTERVAL '100 years'`).
- `used_at` is never set — they are multi-use.
- Validation gates on `revoked_at IS NULL` AND `expires_at > NOW()`.
- `speaker_id` is required (always tied to a real speaker).

At most one un-revoked availability token per speaker; rotation revokes the old and inserts a new row.

## Backend

### Speaker self-service endpoints (`server/routes/availability.js`, new file)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/availability/:token` | token | Return `{ speaker: { id, name, photo, headline }, blocked: ['YYYY-MM-DD', ...] }`. Used to bootstrap the speaker portal page. |
| `PUT` | `/api/availability/:token` | token | Body: `{ blocked: ['YYYY-MM-DD', ...] }`. Replaces all *future* blocked dates for the speaker (past dates untouched). |

Rate limit: 10 req/min per IP (matches existing portal limiter).

The PUT replaces the future set transactionally:

```sql
BEGIN;
DELETE FROM speaker_blocked_dates
  WHERE speaker_id = $1 AND blocked_date >= CURRENT_DATE;
INSERT INTO speaker_blocked_dates (speaker_id, blocked_date)
  SELECT $1, unnest($2::date[])
  ON CONFLICT DO NOTHING;
COMMIT;
```

Server-side validation: every date must parse, must be `>= CURRENT_DATE`, max 366 entries (one year).

### Public read endpoint (extend `server/routes/speakers.js`)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/speakers/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD` | none | Return `{ blocked: ['YYYY-MM-DD', ...] }`. Range required, max 365 days. |

Returns blocked dates only — no enquiry IDs, reasons, or other metadata.

### Admin endpoints (extend `server/routes/admin/speakers.js`)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/speakers/:id/availability-link` | Returns `{ link, createdAt }` for the speaker's active availability token. Creates one lazily if none exists. |
| `POST` | `/api/admin/speakers/:id/availability-link/rotate` | Revokes the current token (`revoked_at = NOW()`) and creates a new one. Returns the new `{ link }`. |
| `GET` | `/api/admin/speakers/:id/blocked-dates?from=&to=` | Read-only blocked dates for admin display. (May return same shape as public endpoint — internal call can reuse the public handler.) |

CSRF gate applies to mutating endpoints (existing pattern).

### Token query updates (`server/db/token-queries.js`)

- Extend `validateToken()` to handle `type === 'availability'`: skip `used_at` check, gate on `revoked_at IS NULL`. Existing `used_at` semantics for `'new'`/`'update'` unchanged.
- Add `getActiveAvailabilityToken(speakerId)` helper — selects the most recent un-revoked `'availability'` row for the speaker.
- Add `revokeToken(token)` — sets `revoked_at = NOW()`.

## Frontend

### New page — `src/pages/SpeakerAvailabilityPage.jsx`

Route: `/speaker-availability#<token>` (matches existing `/speaker-portal#<token>` pattern, hash keeps the token out of server access logs).

- No layout shell (matches `/speaker-portal` pattern).
- Fetches `GET /api/availability/:token` on mount.
- Renders a multi-month calendar view (next 12 months). Each future day is a tappable cell that toggles between "available" and "blocked" locally.
- Sticky "Save changes" button calls `PUT /api/availability/:token` with the full blocked set; success state shows a confirmation.
- Read-only past months for context (cannot edit).
- Invalid / revoked token shows a friendly "this link has expired — contact Flight Speakers" screen.

### Update — `src/components/forms/AvailabilityCalendar.jsx`

- Drop `generateAvailability()` and the `seededRandom` / `hashString` helpers.
- Add a hook (e.g. `useSpeakerAvailability(speakerId, fromDate, toDate)`) that fetches `/api/speakers/:id/availability` once per `(speakerId, range)` tuple and caches in component state.
- Map fetched blocked dates to a `Set<'YYYY-MM-DD'>`. A day is "unavailable" if it's in the set, otherwise "available". Drop the "limited" branch.
- Legend updates: only "Likely available" and "Booked" remain.
- Loading state: show skeleton dots while fetching; render past months without dots.
- No `speakerId` (e.g. generic enquiry without a chosen speaker) → render plain calendar with no availability dots.

### Update — `src/admin/AdminSpeakerDetailPage.jsx` (or component)

- New section "Availability link" with:
  - Read-only display of the link URL (or hidden until "Reveal" clicked).
  - "Copy link" button.
  - "Rotate link" button (with confirm dialog — invalidates the previous link).
- Optional: small read-only calendar showing the speaker's next-3-months blocks. Re-uses the existing `AvailabilityCalendar` styles in display-only mode.

### Routing

Add to `src/App.jsx`:

```jsx
<Route path="/speaker-availability" element={<SpeakerAvailabilityPage />} />
```

(Same shell-less pattern as `/speaker-portal`.)

## Sequence flow

```
Admin clicks "Get availability link" on AdminSpeakerDetailPage
  -> GET /api/admin/speakers/:id/availability-link
  -> server: lazy-create 'availability' token if none active, return URL
Admin pastes link into Klaviyo email / Slack / however they reach the speaker

Speaker opens link
  -> SpeakerAvailabilityPage mounts, reads token from hash
  -> GET /api/availability/:token -> { speaker, blocked }
  -> Speaker toggles future days, hits Save
  -> PUT /api/availability/:token { blocked: [...] }
  -> Server replaces future rows transactionally

Client opens enquiry form, picks a speaker, opens date picker
  -> AvailabilityCalendar fetches /api/speakers/:id/availability?from=&to=
  -> Days in the blocked set render with red 'booked' state, disabled
  -> Other days render normally
```

## Error handling

- **Invalid/revoked token (speaker page):** show friendly error screen with mailto link to support. Do not leak whether the token ever existed.
- **PUT validation failure:** return 400 with field-level errors; UI surfaces inline.
- **Public endpoint with unknown speaker:** return `{ blocked: [] }` (don't leak existence).
- **Network failure on the enquiry-form fetch:** silently fall back to "no availability data" (every day rendered as available, no dots). The form remains usable; client can still submit, admin can still vet.

## Testing

- Unit: token validation handles `'availability'` type correctly (allows multi-use, rejects revoked).
- Unit: PUT replaces future rows but leaves past rows intact; rejects past dates and oversize payloads.
- Integration: end-to-end portal flow — generate link as admin, GET via token, PUT block dates, public endpoint reflects them, rotate token invalidates old.
- Integration: enquiry-form calendar fetches and renders blocks for a known speaker.
- Manual: speaker UX on mobile (toggle granularity, save flow, error screens).

## Migration / rollout

- Schema changes are additive: new table, new CHECK clause, new nullable column. Safe to apply on top of existing data.
- No data migration needed (existing speakers start with zero blocked dates → calendar renders all-available, an improvement over the current fake red days).
- Frontend deploy can ship the calendar update alongside the API; if API isn't deployed yet, the fetch fails and we fall back to all-available, which is acceptable.

## Future (out of scope, noted for context)

- Bulk admin tool: "block these speakers on these dates" (e.g. holiday closure).
- iCal / Google Calendar import.
- Auto-block dates when an enquiry is accepted.
- Speaker-detail public availability surface.
- Klaviyo cadence to auto-send the link monthly.
