# Flight Speakers Website

Premium speaker booking agency. React frontend, Express backend, PostgreSQL + pgvector, Claude AI semantic search.

## Stack
- **Frontend**: React 18, Vite, React Router, Framer Motion, CSS (no Tailwind/UI library)
- **Backend**: Express, PostgreSQL (pgvector), Docker container `flight-speakers-db`
- **AI**: Claude API (Sonnet for search/ranking, Haiku for brief parsing), Voyage embeddings
- **Dev**: `npm run dev:all` runs Vite (port 3000) + Express (port 3001) via concurrently. Express does NOT auto-restart — restart manually after server file changes.

## Key Paths
- `src/` — React frontend
- `src/components/forms/` — Multi-step enquiry form (Typeform-style)
- `src/hooks/useMultiStepForm.js` — Form state, steps, validation
- `src/admin/` — Admin SPA (separate shell, /admin/* routes)
- `server/` — Express API
- `server/services/claude.js` — Semantic search with vector retrieve + Claude rerank
- `server/routes/parseBrief.js` — Brief extraction (Haiku)
- `server/db/` — PostgreSQL queries, init.sql, seed

## Conventions
- CSS: BEM-style with component prefixes (`.mstep-*`, `.cal-*`, `.dash-*`)
- Design tokens via CSS custom properties (`--color-*`, `--space-*`, `--text-*`)
- No external UI library — all components hand-built
- Framer Motion for animations, `EASE = [0.16, 1, 0.3, 1]` everywhere
- Admin auth: httpOnly JWT cookies, username `admin` / password `admin`

## Rules
- Never auto-convert currencies — let user choose
- Budget/currency are always user-confirmed, never silently pre-populated from AI extraction
- Keep Haiku for brief parsing, Sonnet for search ranking
- Don't skip the budget form step even if extracted from brief — user must confirm

## Planned Integrations (not yet implemented)

### Klaviyo — Transactional Email for Speaker Briefs
- Replace the current `mailto:` workaround in the Share flow with Klaviyo's transactional email API
- `POST /api/share/brief` endpoint: accepts speaker data + recipient email, builds the HTML brief server-side, sends via Klaviyo `/v1/email/send`
- Sends from `hello@flightspeakers.com` with the full HTML brief rendered inline (no attachment needed)
- Env vars needed: `KLAVIYO_API_KEY`
- Requires Klaviyo account with transactional email enabled + verified sending domain
- Current frontend: `src/components/brief/BriefActions.jsx` — "Share via Email" button will call the new endpoint instead of opening mailto

### Monday.com — Enquiry Pipeline Sync
- When an enquiry is accepted in admin, auto-create an item on a Monday.com board via their GraphQL API (`https://api.monday.com/v2`)
- New service: `server/services/monday.js` — `createMondayItem(enquiry, speaker)` using `create_item` mutation
- Hook into enquiry status update in `server/routes/admin.js` — fire-and-forget after status changes to "accepted"
- Column mapping: Client Name, Speaker, Event Date, Status, Budget, Email, Location, Brief
- Env vars needed: `MONDAY_API_TOKEN`, `MONDAY_BOARD_ID`
- Column IDs are board-specific — must be configured per board setup
