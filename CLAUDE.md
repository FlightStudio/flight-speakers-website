# Flight Speakers Website

Premium speaker booking agency. React frontend, Express backend, PostgreSQL + pgvector, Claude AI semantic search.

## Stack
- **Frontend**: React 18, Vite 7, React Router v6, Framer Motion v12, CSS (no Tailwind/UI library)
- **Backend**: Express 5, PostgreSQL 16 (pgvector), Docker container `flight-speakers-db`
- **AI**: Claude API (Sonnet `claude-sonnet-4-5-20250929` for search/ranking, Haiku `claude-haiku-4-5-20251001` for brief parsing), Voyage AI `voyage-3` embeddings (1024 dimensions)
- **3D**: React Three Fiber + Three.js (WebGL gradient mesh background on homepage)
- **PDF**: @react-pdf/renderer (speaker briefs)
- **Dev**: `npm run dev:all` runs Vite (port 3000) + Express (port 3001) via concurrently. Express does NOT auto-restart — restart manually after server file changes.
- **Module system**: ES modules (`"type": "module"` in package.json)
- **Node**: v24.13.0 (.nvmrc), engines >=20.0.0
- **Font**: Inter (Google Fonts, weights 300-700)
- **Theme**: Dark mode default, toggle via `data-theme` attribute on `<html>`, persisted in localStorage

## Key Paths

### Frontend (`src/`)
- `src/main.jsx` — React entry, renders `<BrowserRouter><App />`
- `src/App.jsx` — Route definitions (nested Routes pattern)
- `src/constants/animation.js` — `EASE = [0.16, 1, 0.3, 1]`
- `src/styles/index.css` — Global CSS, design tokens, theme variables

#### Pages (`src/pages/`)
- `HomePage.jsx` — Hero with GradientMesh, AI search input with typing animation, AI pipeline demo, speaker carousel with topic filters, social proof bar, CTA section
- `SpeakersPage.jsx` — Full speaker grid with filters
- `SpeakerDetailPage.jsx` — Speaker profile with video embed, social stats pills, related speakers, enquiry CTA. Tracks views via `POST /api/speakers/:id/view`
- `SearchResultsPage.jsx` — AI search results with match scores, reasoning, speaker selection toggles, BriefActions sticky bar
- `EnquiryPage.jsx` — Full-screen Typeform-style multi-step form (no layout shell)
- `BookPage.jsx` — CTA landing page with orb animation
- `AboutPage.jsx` — About/team page
- `SpeakerPortalPage.jsx` — Magic-link speaker self-service form (no layout shell)

#### Components (`src/components/`)
- `layout/` — `Header.jsx` (nav, theme toggle, search link), `Footer.jsx`, `Layout.jsx` (wraps Header+Footer)
- `speakers/SpeakerCard.jsx` — Card with photo, name, headline, topics, social stats. Hover animation with Framer Motion
- `speakers/SpeakerGrid.jsx` — Responsive grid of SpeakerCards
- `search/AISearchBar.jsx` — Reusable search input (forwardRef), navigates to `/search?q=`
- `brief/SpeakerBrief.jsx` — PDF document component (3 sections: AI Recommended, Your Selected, Other AI Recommendations)
- `brief/BriefActions.jsx` — Sticky action bar (Download PDF, Share via Email mailto:, Copy Link). Appears on search results and enquiry review step
- `forms/MultiStepEnquiryForm.jsx` — Main form orchestrator, manages step transitions with AnimatePresence
- `forms/MultiStepEnquiryForm.css` — Form styles (`.mstep-*` prefix)
- `forms/steps/` — Individual step components:
  - `StepAboutYou.jsx`, `StepContactDetails.jsx` — Name, org, email, phone
  - `StepEventOverview.jsx` — Event type (pills), date (calendar), location
  - `StepAudienceBudget.jsx` — Audience size, engagement type (Paid/Pro Bono), budget tree
  - `StepBrief.jsx` — Textarea for event brief, triggers AI extraction via `/api/parse-brief`
  - `StepConfirmPrefill.jsx` — Shows AI-extracted fields for user confirmation
  - `StepReview.jsx` — Final review with edit links back to specific steps
- `forms/AvailabilityCalendar.jsx` — Custom calendar with date range toggle, scrollable month pills (`.cal-*` prefix)
- `forms/FormProgressBar.jsx` — Progress indicator with speaker avatars
- `forms/FormNavigation.jsx` — Back/Next/Submit buttons
- `forms/FormField.jsx` — Reusable input wrapper
- `forms/SuccessScreen.jsx` — Post-submission success animation
- `forms/WhyWeAsk.jsx` — Tooltip explaining why each field is needed
- `effects/GradientMesh.jsx` — WebGL gradient background using React Three Fiber (R3F Canvas with custom shader)
- `effects/AIMatchingCanvas.jsx` — Visual AI matching animation
- `effects/TextReveal.jsx` — Text reveal animation component
- `effects/MagneticButton.jsx` — Button with magnetic cursor follow effect
- `common/AnimatedText.jsx` — Text animation utility
- `common/MagneticButton.jsx` — Magnetic hover effect wrapper
- `common/ParallaxImage.jsx` — Parallax scroll image

#### Hooks (`src/hooks/`)
- `useMultiStepForm.js` — Form state machine: steps, validation, navigation, prefill, submission. Exports `STEPS`, `EVENT_TYPES`, `CURRENCIES`, `getBudgetRanges()`, `FIELD_STEP_MAP`
- `useInView.js` — Intersection Observer hook
- `useMagneticEffect.js` — Magnetic cursor-following effect
- `useSmoothScroll.js` — Lenis smooth scrolling integration

#### Utils (`src/utils/`)
- `dateFormat.js` — `formatDisplayDate()`, `formatEventDate()` (handles pipe-delimited date ranges `2025-03-15|2025-03-20`)
- `shuffle.js` — `sessionShuffle()` — seeded PRNG (mulberry32) for session-stable speaker order
- `prefetch.js` — Route/data prefetching utility

### Admin SPA (`src/admin/`)
- `AdminApp.jsx` — Auth gate + nested routes under `/admin/*`
- `AdminLayout.jsx` — Sidebar + content area (uses `<Outlet />`)
- `admin.css` — All admin styles (`.dash-*`, `.enquiry-*`, `.admin-*` prefixes)

#### Admin Pages
- `AdminDashboardPage.jsx` — Stats cards, enquiry chart, top speakers, recent activity, popular topics
- `AdminEnquiriesPage.jsx` — Enquiry list with filters (status, engagement type, rejection reason), sorting, pagination
- `AdminEnquiryDetailPage.jsx` — Full enquiry view, speaker recommendations (requested + related + semantic + additional), status actions, response templates
- `AdminSpeakersPage.jsx` — Speaker grid with analytics table toggle
- `AdminSpeakerDetailPage.jsx` — Speaker profile + analytics (views, enquiries, recommendations, AI scores, conversion rate)
- `AdminSpeakerFormPage.jsx` — Create/edit speaker form (creates draft for review queue)
- `AdminReviewPage.jsx` — Review queue for speaker drafts (new/update), approve/reject with inline editing
- `AdminLoginPage.jsx` — Login form
- `AdminSettingsPage.jsx` — Integration settings (Monday.com, Klaviyo health checks + test)

#### Admin Components
- `AdminSidebar.jsx` — Nav with review queue badge count
- `AdminStatCards.jsx` — Dashboard metric cards (total, new, accepted, rejected, this week)
- `DashboardChart.jsx` — Enquiries by day line chart
- `DashboardTopSpeakers.jsx` — Top 5 speakers by enquiries
- `DashboardActivity.jsx` — Recent enquiry activity feed
- `DashboardInsights.jsx` — Popular topics, event types, response metrics
- `DashboardNewRequests.jsx` — New enquiry cards
- `EnquiryList.jsx`, `EnquiryCard.jsx`, `EnquiryDetail.jsx`, `EnquiryActions.jsx` — Enquiry management
- `EnquiryAnalyticsModal.jsx` — Revenue, acceptance rate, budget analytics
- `SpeakerCardGrid.jsx` — Admin speaker grid
- `SpeakerForm.jsx` — Speaker create/edit form fields
- `SpeakerAnalyticsTable.jsx` — Speaker performance metrics table
- `SpeakerRecommendations.jsx` — AI-recommended speakers for an enquiry
- `StatusBadge.jsx` — Coloured status pill

#### Admin Hooks
- `useAdminAuth.js` — Auth state, login/logout, checks `/api/admin/me`
- `useEnquiries.js` — Fetch enquiry list with filters
- `useEnquiry.js` — Fetch single enquiry with speakers
- `useSpeaker.js` — Fetch single speaker for admin

### Backend (`server/`)

#### Entry & Middleware
- `server/index.js` — Express app setup: helmet (CSP disabled), CORS (ALLOWED_ORIGINS), JSON (1MB limit), cookie-parser, request logging, rate limiters, routes, health check, API dashboard HTML page, `startDailyRefresh()` on boot
- `server/middleware/auth.js` — JWT auth: `signToken()` (HS256, 24h), `requireAdmin()` middleware reads `admin_token` cookie

#### Routes
- `server/routes/speakers.js` — `GET /api/speakers` (filters: topic, audience, limit), `GET /api/speakers/meta/topics`, `GET /api/speakers/meta/audiences`, `GET /api/speakers/:id` (+ related speakers), `POST /api/speakers/:id/view` (fire-and-forget view tracking)
- `server/routes/search.js` — `GET /api/search?q=&limit=&budget=` (semantic search, tracks recommendations), `GET /api/search/suggest?q=` (autocomplete from topics + names)
- `server/routes/enquiry.js` — `POST /api/enquiry` (validates, persists, Klaviyo fire-and-forget: profile + list subscription + event tracking)
- `server/routes/parseBrief.js` — `POST /api/parse-brief` (Haiku extracts: eventType, eventDate, eventLocation, audienceSize, engagementType, budgetRange, customBudget, budgetCurrency). Validates against allowed values. Regex fallback for budget extraction
- `server/routes/admin.js` — All admin endpoints behind `requireAdmin`:
  - Auth: `POST /login`, `POST /logout`, `GET /me`
  - Stats: `GET /stats`, `GET /enquiry-analytics`, `GET /dashboard`, `GET /speakers/analytics`
  - Speakers: `POST /speakers` (creates draft), `PATCH /speakers/:id` (creates update draft), `GET /speakers/:id` (+ analytics), `DELETE /speakers/:id`, `POST /speakers/:id/photo` (upload to GCS)
  - Enquiries: `GET /enquiries` (paginated, sortable), `GET /enquiries/:id` (auto-marks as reviewed, fetches semantic matches), `PATCH /enquiries/:id` (status update, triggers notifications)
  - Review: `GET /review`, `GET /review/counts`, `POST /review/:id/approve`, `POST /review/:id/reject`
  - Invites: `POST /invite/new`, `POST /invite/:speakerId` (magic links for speaker portal)
  - Templates: `GET /templates`, `GET /templates/:reasonKey`, `PUT /templates/:reasonKey`
  - Integrations: `GET /integrations/monday`, `GET /integrations/klaviyo`, `POST /integrations/klaviyo/test`
  - Social: `POST /social-stats/refresh`
- `server/routes/portal.js` — `GET /api/portal/:token` (validate token, return speaker data for prefill), `POST /api/portal/:token` (submit profile as draft, mark token used)

#### Services
- `server/services/claude.js` — `semanticSearch(query, limit, budget)`: tries vector retrieve → Claude rerank first, falls back to all-speakers → Claude, then full-text search. 5-min in-memory cache (100 entries). Uses Sonnet for ranking with structured JSON response (matchScore 0-100)
- `server/services/embeddings.js` — Voyage AI integration: `buildSpeakerText()`, `generateEmbeddings()` (document), `generateQueryEmbedding()` (query). Model: `voyage-3`
- `server/services/klaviyo.js` — Klaviyo REST API (revision `2024-10-15`): `createOrUpdateProfile()`, `subscribeToList()`, `trackEvent()`, `getList()`, `getAccountInfo()`
- `server/services/monday.js` — `createMondayItem(enquiry)`: creates board item via GraphQL + posts structured update comment. Maps budget to labels, location to regions, parses dates. Group: `group_mkvnqw22`
- `server/services/notifications.js` — `notifyEnquiryResponse()`: on accepted → Monday.com item (fire-and-forget), on any response → Klaviyo event
- `server/services/socialStats.js` — Influencers Club API: `refreshAllSpeakerStats()` fetches follower counts per platform (instagram, tiktok, youtube, x→twitter). `startDailyRefresh()` schedules via node-cron at 3am + initial refresh for speakers with NULL `social_stats_updated_at`. 300ms delay between API calls

#### Database (`server/db/`)
- `connection.js` — pg Pool (max 20, idle 30s, connect timeout 5s)
- `init.sql` — Schema: `speakers` (id TEXT PK, name, headline, photo, bio, topics[], audiences[], keynotes[], speaking_format, video_url, embedding vector(1024), social_profiles JSONB, social_stats JSONB, fee_min INT, gender, ethnicity, nationality, location), `enquiries` (id TEXT PK, status CHECK 'new'|'reviewed'|'accepted'|'rejected'|'responded', + many fields), `speaker_views`, `speaker_recommendations`, `speaker_drafts` (type 'new'|'update', status 'pending'|'approved'|'rejected'), `speaker_tokens` (magic links), `admin_users`, `response_templates` (4 templates: accepted, pro_bono, no_availability, exclusivity). HNSW index on embeddings, GIN full-text index
- `queries.js` — `getAllSpeakers()`, `getSpeakerById()`, `getRelatedSpeakers()` (topic overlap), `getSpeakerProfilesForSearch()`, `createSpeaker()`, `updateSpeaker()`, `fullTextSearch()`, `vectorSearch()` (cosine distance), `updateSpeakerEmbedding()`, `searchSuggest()`, `getAllTopics()`, `getAllAudiences()`
- `enquiry-queries.js` — `createEnquiry()`, `getEnquiries()` (paginated, multi-sort including budget parsing), `getEnquiryById()`, `updateEnquiry()`, `getEnquiryStats()`, `getEnquiryAnalytics()` (revenue/rejection by currency, acceptance rate), `getSpeakerAnalytics()` (views, enquiries, recommendations, conversion rate, AI scores), `getSpeakerDetailAnalytics()`, `getDashboardAnalytics()` (enquiries by day, top speakers, popular topics, response metrics), `deleteSpeaker()`, `getAdminUser()`
- `draft-queries.js` — `createDraft()`, `getPendingDrafts()`, `getDraftById()`, `approveDraft()` (creates/updates speaker), `rejectDraft()`, `getDraftCounts()`
- `template-queries.js` — `getAllTemplates()`, `getTemplateByReasonKey()`, `updateTemplate()`
- `token-queries.js` — `createToken()` (crypto.randomBytes 32-byte hex), `validateToken()` (checks expiry + used_at, returns speaker data for prefill), `markTokenUsed()`
- `seed.js` — Seeds speakers from `server/data/speakers.js` (upsert)
- `seed-embeddings.js` — Generates Voyage embeddings for all speakers
- `seed-admin.js` — Creates admin user (bcrypt hash, 12 rounds)
- `seed-enquiries.js` — Seeds ~30 sample enquiries across various speakers/statuses

#### Data
- `server/data/speakers.js` — Static speaker array (13 speakers): Steven Bartlett, Jordan Schwarzenberger, Harry Stebbings, Vanessa Van Edwards, Nischa Shah, Dr Kristen Holmes, Davina McCall, Paul C Brunson, Nir Eyal, Dr Vonda Wright, Evy Poumpouras, Paul Scanlon, Maggie Sellers. Each has: id (slug), name, headline, photo, bio, topics[], audiences[], keynotes[], speakingFormat, videoUrl, feeMin, gender, nationality, location, socialProfiles{}

## Route Map

### Public Routes (with Layout shell)
- `/` — HomePage
- `/speakers` — SpeakersPage
- `/speakers/:id` — SpeakerDetailPage
- `/search` — SearchResultsPage
- `/about` — AboutPage
- `/book` — BookPage

### Full-screen Routes (no Layout shell)
- `/enquiry` — EnquiryPage (generic)
- `/enquiry/:speakerId` — EnquiryPage (pre-selected speaker)
- `/speaker-portal/:token` — SpeakerPortalPage

### Admin Routes (`/admin/*`)
- `/admin` — Dashboard
- `/admin/enquiries` — Enquiry list
- `/admin/enquiries/:id` — Enquiry detail
- `/admin/speakers` — Speaker list
- `/admin/speakers/new` — New speaker form
- `/admin/speakers/:id` — Speaker detail
- `/admin/speakers/:id/edit` — Edit speaker form
- `/admin/review` — Draft review queue
- `/admin/integrations` — Settings

## API Endpoints

### Public
- `GET /api/speakers` — List all (params: topic, audience, limit)
- `GET /api/speakers/meta/topics` — All unique topics
- `GET /api/speakers/meta/audiences` — All unique audiences
- `GET /api/speakers/:id` — Speaker + related speakers
- `POST /api/speakers/:id/view` — Track page view
- `GET /api/search?q=&limit=&budget=` — AI semantic search
- `GET /api/search/suggest?q=` — Autocomplete
- `POST /api/enquiry` — Submit enquiry
- `POST /api/parse-brief` — AI brief extraction (Haiku)
- `GET /api/portal/:token` — Validate speaker portal token
- `POST /api/portal/:token` — Submit speaker profile via portal
- `GET /api/health` — Health check
- `GET /api` — API dashboard HTML

### Admin (all require `admin_token` cookie)
- `POST /api/admin/login` — Login (returns httpOnly cookie)
- `POST /api/admin/logout` — Logout
- `GET /api/admin/me` — Current user
- `GET /api/admin/stats` — Enquiry counts by status
- `GET /api/admin/enquiry-analytics` — Revenue, acceptance rate, budget analytics
- `GET /api/admin/dashboard` — Full dashboard data
- `GET /api/admin/speakers/analytics` — Speaker performance table
- `GET /api/admin/speakers/:id` — Speaker + analytics
- `POST /api/admin/speakers` — Create speaker (draft)
- `PATCH /api/admin/speakers/:id` — Update speaker (draft)
- `DELETE /api/admin/speakers/:id` — Delete speaker
- `POST /api/admin/speakers/:id/photo` — Upload photo to GCS (multipart, updates speaker directly)
- `GET /api/admin/enquiries` — Paginated enquiry list
- `GET /api/admin/enquiries/:id` — Enquiry detail + recommendations
- `PATCH /api/admin/enquiries/:id` — Update status/notes
- `GET /api/admin/review` — Pending drafts
- `GET /api/admin/review/counts` — Draft counts for badge
- `POST /api/admin/review/:id/approve` — Approve draft
- `POST /api/admin/review/:id/reject` — Reject draft
- `POST /api/admin/invite/new` — Generate new speaker magic link
- `POST /api/admin/invite/:speakerId` — Generate update magic link
- `GET /api/admin/templates` — Response templates
- `GET /api/admin/templates/:reasonKey` — Single template
- `PUT /api/admin/templates/:reasonKey` — Update template
- `GET /api/admin/integrations/monday` — Monday.com health check
- `GET /api/admin/integrations/klaviyo` — Klaviyo health check
- `POST /api/admin/integrations/klaviyo/test` — Send test event
- `POST /api/admin/social-stats/refresh` — Trigger social stats refresh

## Rate Limits
- Search: 30 req/min
- Enquiry: 5 req/15 min
- Login: 10 req/15 min
- Portal: 10 req/min

## Conventions
- CSS: BEM-style with component prefixes (`.mstep-*`, `.cal-*`, `.dash-*`, `.speaker-hero__*`, `.ai-pipe__*`, `.cta-card__*`)
- Design tokens via CSS custom properties (`--color-*`, `--space-*`, `--text-*`)
- No external UI library — all components hand-built
- Framer Motion for animations, `EASE = [0.16, 1, 0.3, 1]` everywhere
- Admin auth: httpOnly JWT cookies (24h expiry, HS256), username `admin` / password `admin`
- Speaker IDs are URL-safe slugs (e.g. `steven-bartlett`)
- Enquiry IDs: `enq_{timestamp}_{random}`
- All speaker changes go through draft review queue (never directly saved), except photo uploads which update directly
- Speaker photos uploaded to GCS via admin drag/drop (edit form + detail page), stored as public URL in `photo` column
- Date ranges stored as pipe-delimited: `2025-03-15|2025-03-20`
- Social stats: JSONB with nested platform objects `{ youtube: { subscribers: N }, instagram: { followers: N } }`
- DB camelCase mapping via SQL aliases (`fee_min AS "feeMin"`)

## Rules
- Never auto-convert currencies — let user choose
- Budget/currency are always user-confirmed, never silently pre-populated from AI extraction
- Keep Haiku for brief parsing, Sonnet for search ranking
- Don't skip the budget form step even if extracted from brief — user must confirm

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `ANTHROPIC_API_KEY` — Claude API
- `VOYAGE_API_KEY` — Voyage embeddings
- `INFLUENCERS_CLUB_API_KEY` — Social stats API
- `JWT_SECRET` — Admin auth signing key
- `MONDAY_API_TOKEN` — Monday.com GraphQL API
- `MONDAY_BOARD_ID` — Target board (default: `1153323847`)
- `KLAVIYO_API_KEY` — Klaviyo REST API
- `KLAVIYO_ENQUIRY_LIST_ID` — CRM list for enquiries
- `KLAVIYO_NEWSLETTER_LIST_ID` — Newsletter subscription list
- `NODE_ENV` — development/production
- `ALLOWED_ORIGINS` — CORS whitelist (comma-separated)
- `APP_URL` — Frontend URL (for magic link generation)
- `PORT` — Express port (default 3001)
- `GCS_BUCKET` — Google Cloud Storage bucket for speaker photos (default: `flight-speakers-photos`)

## NPM Scripts
- `npm run dev` — Vite dev server (port 3000)
- `npm run build` — Production build → `dist/`
- `npm run server` — Express server (port 3001)
- `npm run dev:all` — Both concurrently
- `npm run db:start` — `docker-compose up -d`
- `npm run db:stop` — `docker-compose down`
- `npm run db:seed` — Seed speakers from data file
- `npm run db:embed` — Generate Voyage embeddings

## Deployment
- **GCP project**: `flight-speakers` (NOT `flightstudio` — separate workspace). Account: `diana@steven.com`.
- **Frontend**: Vercel (auto-deploys from `main`), `vercel.json` rewrites `/api/*` → Cloud Run
- **API**: Google Cloud Run (`flight-speakers-api`, europe-west2, 512Mi, 1 CPU, 0-3 instances, port 3001). URL: `https://flight-speakers-api-516196678853.europe-west2.run.app`
- **DB**: Google Cloud SQL (`flight-speakers-db`, PostgreSQL 16 + pgvector, `db-f1-micro`, europe-west2-a)
- **Photos**: Google Cloud Storage bucket `flight-speakers-photos` (europe-west2, public read). URLs: `https://storage.googleapis.com/flight-speakers-photos/speakers/{id}.webp`. Uploaded via admin panel, stored directly in speaker `photo` column
- **Secrets**: Google Secret Manager (project `flight-speakers`)
- **Redeploy API**: `gcloud run deploy flight-speakers-api --source . --region europe-west2 --project flight-speakers --quiet`
- **Dockerfile**: `node:20-alpine`, `npm ci --omit=dev`, copies `server/` only, `CMD node server/index.js`

## Dev Proxy (vite.config.js)
- `/api` → `http://localhost:3001` (Express API)
- `/uploads` → `http://localhost:3001` (legacy local uploads, may be removed)
