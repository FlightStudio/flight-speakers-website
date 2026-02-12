# Flight Speakers — Technical Documentation

A comprehensive guide to help junior developers understand the architecture, patterns, and AI integration that power this speaker booking platform.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Frontend Deep Dive](#2-frontend-deep-dive)
3. [Backend Deep Dive](#3-backend-deep-dive)
4. [Database](#4-database)
5. [AI Integration](#5-ai-integration)
6. [Admin Dashboard](#6-admin-dashboard)
7. [Key Patterns](#7-key-patterns)
8. [Dev Setup](#8-dev-setup)

---

## 1. Architecture Overview

Flight Speakers is a **full-stack JavaScript application** with a clean separation between public-facing pages and an admin dashboard. Here's how the pieces fit together:

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                 │
│  ┌──────────────────────┐   ┌─────────────────────┐    │
│  │  Public Pages        │   │  Admin SPA          │    │
│  │  - Home              │   │  - Dashboard        │    │
│  │  - Search            │   │  - Enquiries        │    │
│  │  - Speaker Detail    │   │  - Speaker Analytics│    │
│  │  - Enquiry Form      │   │  (Protected)        │    │
│  └──────────────────────┘   └─────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           ↓ HTTP / JSON
┌─────────────────────────────────────────────────────────┐
│              Express.js API (Node 20+)                   │
│  Routes: /api/speakers, /api/search, /api/enquiry...    │
│  Services: Claude AI, Voyage embeddings, Notifications  │
└─────────────────────────────────────────────────────────┘
                           ↓ pg driver
┌─────────────────────────────────────────────────────────┐
│        PostgreSQL 16 + pgvector (Docker)                 │
│  Tables: speakers, enquiries, admin_users, views...     │
│  Vector embeddings for semantic search                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              External APIs                               │
│  - Anthropic Claude (semantic search + brief parsing)   │
│  - Voyage AI (embedding generation)                      │
│  - Klaviyo (newsletter stubs)                           │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

**Frontend:**
- React 19 + React Router 7 for routing
- Vite for fast dev server and HMR
- Framer Motion for animations
- CSS Modules approach (BEM naming)

**Backend:**
- Express 5 (ES modules)
- PostgreSQL with `pg` driver
- Anthropic SDK for Claude AI
- JWT for admin auth
- bcrypt for password hashing

**Database:**
- PostgreSQL 16
- pgvector extension for vector similarity search
- HNSW index for fast nearest-neighbor lookups

---

## 2. Frontend Deep Dive

### 2.1 Routing Structure (`src/App.jsx`)

The app uses **nested routing** to separate public pages, full-screen flows, and the admin dashboard:

```jsx
<Routes>
  {/* Admin — separate shell, no public layout */}
  <Route path="/admin/*" element={<AdminApp />} />

  {/* Enquiry form — full-screen Typeform-style, no layout */}
  <Route path="/enquiry" element={<EnquiryPage />} />
  <Route path="/enquiry/:speakerId" element={<EnquiryPage />} />

  {/* Public pages — wrapped in Layout with header/footer */}
  <Route path="*" element={
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/speakers/:id" element={<SpeakerDetailPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Layout>
  } />
</Routes>
```

**Why this pattern?**
- Admin pages don't need the public header/footer
- Enquiry pages need full-screen treatment (like Typeform)
- All other pages share the same Layout shell

### 2.2 Multi-Step Form System

The enquiry form is the most complex frontend feature. It uses a **custom hook + component architecture**:

#### Hook: `useMultiStepForm.js`

This hook manages:
- **Form state** (formData object with all fields)
- **Navigation** (currentStep, direction for animations)
- **Validation** (per-field validation tied to step requirements)
- **Prefilled fields** (fields extracted from AI brief parsing, which should be skipped in navigation)
- **Submission** (POST to `/api/enquiry`)

**Key exports:**
```js
export const STEPS = [
  { id: 'name', heading: "What's your name?", field: 'name', type: 'text', required: true },
  { id: 'organization', heading: 'Where do you work?', field: 'organization', type: 'text', required: true },
  { id: 'email', heading: "What's your email?", field: 'email', type: 'email', required: true },
  // ... more steps
  { id: 'engagementBudget', heading: 'Is this paid or pro bono?', field: 'engagementType', type: 'engagementBudgetTree', required: true },
  { id: 'brief', heading: "Describe what you're looking for", field: 'brief', type: 'textarea', required: true },
  { id: 'review', heading: 'Review your enquiry', field: null, required: false }
]
```

**Step types:**
- `text`, `email`, `tel`, `date`, `textarea` — standard HTML inputs
- `pills` — custom pill selector (replaces dropdowns)
- `engagementBudgetTree` — multi-level conditional tree (Paid/Pro Bono → Has Budget → Range)
- `review` — custom review screen with editable summary

**Validation logic:**
```js
function validateField(field, value, formData) {
  switch (field) {
    case 'name':
      return value.trim() ? '' : 'Please enter your name'
    case 'email':
      if (!value.trim()) return 'Please enter your email'
      if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email'
      return ''
    case 'engagementType':
      // Validates engagement tree completeness
      if (!value.trim()) return 'Please select paid or pro bono'
      if (value === 'Paid' && formData) {
        if (!formData.hasBudget?.trim()) return 'Please select whether you have a budget'
        if (formData.hasBudget === 'Yes' && !formData.budgetRange?.trim()) {
          return 'Please select or enter a budget range'
        }
      }
      return ''
    // ...
  }
}
```

#### Component: `MultiStepEnquiryForm.jsx`

This component orchestrates the form UI:

**1. Prefill Flow (Brief Parsing)**

When a user arrives with a `?brief=...` query param, the form:
1. Shows a confirmation screen (`StepConfirmPrefill`)
2. Calls `/api/parse-brief` to extract structured data from the brief (event type, date, budget, etc.)
3. Prefills form fields with extracted data
4. Marks those fields as "prefilled" so navigation skips them

```js
// Check prefetch cache first (for instant load), then fetch
useEffect(() => {
  if (!prefillBrief) return
  let cancelled = false

  async function parseBrief() {
    try {
      let data = await getCachedParseBrief(prefillBrief)
      if (!data) {
        const res = await fetch('/api/parse-brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief: prefillBrief }),
        })
        data = await res.json()
      }
      if (cancelled) return
      if (data.extracted && Object.keys(data.extracted).length > 0) {
        setExtractedData(data.extracted)
        setFormData(prev => ({ ...prev, ...data.extracted }))
      }
    } catch { /* graceful degradation */ }
    finally {
      if (!cancelled) setIsParsing(false)
    }
  }
  parseBrief()
  return () => { cancelled = true }
}, [prefillBrief, setFormData])
```

**2. AI-Powered Recommendations**

As the user progresses through the form, the system prefetches speaker recommendations:

```js
// Prefetch recommended speakers — start immediately for prefilled briefs,
// debounce for manual typing on/past the brief step
useEffect(() => {
  if (!briefForSearch || briefForSearch.length < 20) return
  if (briefForSearch === prefetchedBrief) return

  const isPrefilled = !!prefillBrief && briefForSearch === prefillBrief
  if (!isPrefilled) {
    const briefStepIndex = STEPS.findIndex(s => s.id === 'brief')
    if (currentStep < briefStepIndex) return
  }

  const delay = isPrefilled ? 0 : 800 // instant for prefilled, debounced for manual
  const timer = setTimeout(() => {
    setPrefetchedBrief(briefForSearch)
    fetch(`/api/search?q=${encodeURIComponent(briefForSearch)}&limit=6`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const filtered = (data.speakers || []).filter(s => s.id !== formData.speakerId)
          setRecommendedSpeakers(filtered.slice(0, 4))
          setRecommendedScores(data.scores || {})
          setRecommendedReasonings(data.reasonings || {})
        }
      })
      .catch(() => {})
  }, delay)
  return () => clearTimeout(timer)
}, [briefForSearch, currentStep, prefetchedBrief, formData.speakerId, prefillBrief])
```

**3. Review Step**

The review step (`StepReview.jsx`) shows:
- All filled fields in a grid (click to edit → jumps back to that step)
- AI-recommended speakers (shown if available) with match scores
- Ability to select additional speakers to include in the enquiry
- Newsletter opt-in checkbox

```js
// Review grid renders each field with an edit button
{FIELDS.map(({ key, label, format }) => {
  const raw = formData[key]
  const display = format ? format(raw, formData) : raw
  return (
    <button
      key={key}
      type="button"
      className="mstep-review__cell"
      onClick={() => goToStep(FIELD_STEP_MAP[key])} // Jump to that step
    >
      <span className="mstep-review__label">{label}</span>
      <span className="mstep-review__value">{display || '—'}</span>
    </button>
  )
})}
```

### 2.3 Animation Patterns (Framer Motion)

The app uses **consistent animation patterns** across all pages:

**1. Page Transitions (Slide + Fade)**
```js
const variants = {
  enter: (dir) => ({ y: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir) => ({ y: dir > 0 ? -40 : 40, opacity: 0 }),
}

<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={currentStep}
    custom={direction}
    variants={variants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
  >
    {/* Step content */}
  </motion.div>
</AnimatePresence>
```

**2. Scroll-Triggered Animations (InView)**
```js
const ref = useRef(null)
const isInView = useInView(ref, { once: true, margin: '-100px' })

<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 40 }}
  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
  transition={{ duration: 0.6 }}
>
  {/* Content reveals when scrolled into view */}
</motion.div>
```

**3. Conditional Height Animations (Budget Tree)**
```js
{formData.engagementType === 'Paid' && (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.3, ease: EASE }}
  >
    {/* Budget options appear */}
  </motion.div>
)}
```

**4. Parallax Scrolling (Hero)**
```js
const { scrollYProgress } = useScroll()
const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100])
const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

<motion.div style={{ opacity: heroOpacity, y: heroY }}>
  {/* Hero content fades and moves up as you scroll */}
</motion.div>
```

### 2.4 CSS Approach (BEM + Design Tokens)

The codebase uses **BEM naming convention** with **CSS custom properties** for theming:

**BEM Pattern:**
```css
/* Block */
.mstep { }

/* Element */
.mstep__heading { }

/* Modifier */
.mstep__heading--large { }
```

**Design Tokens (CSS Variables):**
```css
:root {
  /* Colors */
  --color-charcoal: #1a1a1a;
  --color-sky: #3b82f6;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;

  /* Typography */
  --font-heading: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

**Why this approach?**
- BEM prevents class name collisions
- CSS variables make theming consistent and maintainable
- No CSS-in-JS overhead (faster runtime performance)
- Easy to scan and understand styles

---

## 3. Backend Deep Dive

### 3.1 Express Server Setup (`server/index.js`)

The server is a **stateless REST API** with middleware for CORS, JSON parsing, and logging:

```js
const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: allowedOrigins, // Restrict to allowed domains (security)
  credentials: true, // Allow cookies (for admin auth)
}))
app.use(express.json())
app.use(cookieParser())

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/speakers', speakersRouter)
app.use('/api/enquiry', enquiryRouter)
app.use('/api/search', searchRouter)
app.use('/api/parse-brief', parseBriefRouter)
app.use('/api/admin', adminRouter) // Protected routes

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  })
})
```

**Key features:**
- **CORS protection:** Only allows requests from configured origins
- **Cookie-based auth:** Admin routes use JWT tokens stored in httpOnly cookies
- **Graceful error handling:** Catches all errors and returns JSON responses
- **Request logging:** Every request is logged to stdout

### 3.2 Route Structure

#### `/api/speakers` (`server/routes/speakers.js`)

Endpoints:
- `GET /api/speakers` — List all speakers (with optional filters: featured, topic, audience, limit)
- `GET /api/speakers/:id` — Speaker detail + related speakers (by shared topics)
- `GET /api/speakers/meta/topics` — All unique topics across speakers
- `GET /api/speakers/meta/audiences` — All unique audiences across speakers

**Example: Get speaker by ID**
```js
router.get('/:id', async (req, res) => {
  const speaker = await getSpeakerById(req.params.id)
  if (!speaker) {
    return res.status(404).json({ success: false, message: 'Speaker not found' })
  }

  const related = await getRelatedSpeakers(req.params.id, speaker.topics, 4)

  // Track view (fire-and-forget)
  pool.query('INSERT INTO speaker_views (speaker_id) VALUES ($1)', [req.params.id])
    .catch(err => console.error('Failed to track view:', err.message))

  res.json({ success: true, speaker, related })
})
```

#### `/api/search` (`server/routes/search.js`)

Endpoints:
- `GET /api/search?q=...&limit=8` — **Semantic search via Claude AI**
- `GET /api/search/suggest?q=...` — Autocomplete suggestions (topics + speaker names)

**How semantic search works:**
1. Validates query parameter
2. Calls `semanticSearch()` from `server/services/claude.js`
3. Returns speakers + AI-generated reasoning for each match
4. Tracks recommendations in database (fire-and-forget)

```js
router.get('/', async (req, res, next) => {
  const { q, limit = 8, budget } = req.query
  if (!q || !q.trim()) {
    return res.status(400).json({ success: false, message: 'Search query is required' })
  }

  const results = await semanticSearch(q, parseInt(limit, 10), budget || undefined)

  // Fire-and-forget: track recommendations
  if (results.speakers.length > 0) {
    const values = results.speakers.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')
    const params = results.speakers.flatMap(s => [s.id, q])
    pool.query(`INSERT INTO speaker_recommendations (speaker_id, query) VALUES ${values}`, params)
      .catch(err => console.error('Failed to track recommendations:', err.message))
  }

  res.json({
    success: true,
    query: q,
    count: results.speakers.length,
    speakers: results.speakers,
    reasonings: results.reasonings,
    scores: results.scores || {},
  })
})
```

#### `/api/enquiry` (`server/routes/enquiry.js`)

Endpoints:
- `POST /api/enquiry` — Submit new enquiry

**Validation:**
- Required fields: name, email, organization, brief
- Email format validation with regex

**What happens on submit:**
1. Validate required fields
2. Insert into `enquiries` table with generated ID
3. Send Klaviyo notifications (stub — currently noop)
4. Return success response

```js
router.post('/', async (req, res) => {
  const { name, organization, email, phone, eventDate, eventLocation,
          audienceSize, budgetRange, eventType, brief, speakerId, speakerName,
          newsletter, additionalSpeakerIds, currency, engagementType,
          hasBudget, recommendations } = req.body

  // Validation
  if (!name || !email || !organization || !brief) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields',
    })
  }

  const enquiry = await createEnquiry({ ...req.body })
  console.log('NEW ENQUIRY:', enquiry.id, '—', name, `<${email}>`)

  // Klaviyo stubs
  if (newsletter) {
    await notifyKlaviyo(email, 'speaker-newsletter', { name })
  }
  await notifyKlaviyo(email, 'speaker-enquiries', { name, organization })

  res.status(201).json({ success: true, enquiryId: enquiry.id })
})
```

#### `/api/parse-brief` (`server/routes/parseBrief.js`)

Endpoints:
- `POST /api/parse-brief` — **Extract structured data from natural language brief**

**How it works:**
1. Accepts `{ brief: "..." }` in request body
2. Sends brief to Claude Haiku with extraction prompt
3. Returns structured JSON with extracted fields (eventType, eventDate, budgetRange, etc.)

**Prompt engineering pattern:**
```js
const SYSTEM_PROMPT = `You extract structured event details from a natural language brief.

Given a brief, extract any of these fields you are confident about:
- eventType: Must be one of: ${EVENT_TYPES.join(', ')}
- eventDate: In YYYY-MM-DD format if a specific date is mentioned
- eventLocation: City, country, or "Virtual"
- audienceSize: A number as a string (e.g. "500")
- engagementType: Must be "Paid" or "Pro Bono" — only if explicitly mentioned
- budgetRange: Must be one of: ${BUDGET_RANGES.join(', ')}

Rules:
- Only include fields you are confident about — do not guess
- For eventType, pick the closest match from the list
- For budgetRange, map the numeric amount to the closest range (ignore currency)
- Return valid JSON only, no other text

Response format:
{ "extracted": { ...only confident fields... } }`
```

**Example response:**
```json
{
  "success": true,
  "extracted": {
    "eventType": "Conference / Summit",
    "eventDate": "2026-06-15",
    "audienceSize": "500",
    "engagementType": "Paid",
    "budgetRange": "$25,000 - $50,000"
  },
  "brief": "I need a leadership speaker for 500 executives at our June conference in London. Budget is around £30k."
}
```

#### `/api/admin/*` (`server/routes/admin.js`)

All admin routes require authentication via `requireAdmin` middleware:

**Authentication flow:**
1. `POST /api/admin/login` — Returns JWT token in httpOnly cookie
2. All subsequent admin requests include cookie automatically
3. `requireAdmin` middleware verifies token on every request

**Available endpoints:**
- `POST /api/admin/login` — Login with username/password
- `POST /api/admin/logout` — Clear auth cookie
- `GET /api/admin/me` — Get current admin user
- `GET /api/admin/dashboard` — Dashboard analytics (enquiries by day, top speakers, etc.)
- `GET /api/admin/enquiries` — List all enquiries (paginated, filterable by status)
- `GET /api/admin/enquiries/:id` — Enquiry detail + AI recommendations
- `PATCH /api/admin/enquiries/:id` — Update enquiry status/notes
- `GET /api/admin/speakers/analytics` — Speaker performance analytics
- `GET /api/admin/speakers/:id` — Speaker detail + analytics
- `PATCH /api/admin/speakers/:id` — Update speaker fees
- `DELETE /api/admin/speakers/:id` — Delete speaker

**Example: Get enquiry detail with AI recommendations**
```js
router.get('/enquiries/:id', requireAdmin, async (req, res) => {
  const enquiry = await getEnquiryById(req.params.id)
  if (!enquiry) {
    return res.status(404).json({ success: false, message: 'Enquiry not found' })
  }

  // Auto-mark as reviewed if new
  if (enquiry.status === 'new') {
    await updateEnquiry(enquiry.id, { status: 'reviewed' })
    enquiry.status = 'reviewed'
  }

  // Fetch speaker recommendations
  let requestedSpeaker = null
  let relatedSpeakers = []
  let semanticMatches = []

  if (enquiry.speaker_id) {
    requestedSpeaker = await getSpeakerById(enquiry.speaker_id)
    if (requestedSpeaker) {
      relatedSpeakers = await getRelatedSpeakers(enquiry.speaker_id, requestedSpeaker.topics, 6)
    }
  }

  if (enquiry.brief) {
    const searchResult = await semanticSearch(enquiry.brief, 8)
    semanticMatches = searchResult.speakers.filter(s => s.id !== enquiry.speaker_id)
  }

  res.json({
    success: true,
    enquiry,
    speakers: { requested: requestedSpeaker, related: relatedSpeakers, semantic: semanticMatches },
  })
})
```

### 3.3 Middleware

#### Authentication (`server/middleware/auth.js`)

**JWT-based admin authentication:**
```js
export function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.admin = { id: decoded.sub, username: decoded.username }
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}
```

**Security features:**
- Tokens stored in httpOnly cookies (not accessible to JavaScript)
- 24-hour expiration
- Secure flag in production (HTTPS-only)
- sameSite: 'strict' (CSRF protection)

---

## 4. Database

### 4.1 PostgreSQL Schema (`server/db/init.sql`)

The database uses **PostgreSQL 16** with the **pgvector extension** for semantic search.

**Core tables:**

#### `speakers`
```sql
CREATE TABLE speakers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    headline TEXT NOT NULL,
    photo TEXT NOT NULL,
    bio TEXT NOT NULL,
    topics TEXT[] NOT NULL DEFAULT '{}',
    audiences TEXT[] NOT NULL DEFAULT '{}',
    keynotes TEXT[] NOT NULL DEFAULT '{}',
    speaking_format TEXT,
    video_url TEXT,
    featured BOOLEAN NOT NULL DEFAULT false,
    embedding vector(1024), -- Voyage AI embedding (1024 dimensions)
    fee_min INTEGER,
    social_profiles JSONB DEFAULT '{}',
    social_stats JSONB DEFAULT '{}',
    social_stats_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_speakers_featured ON speakers (featured) WHERE featured = true;
CREATE INDEX idx_speakers_fts ON speakers USING gin (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(headline, '') || ' ' || coalesce(bio, ''))
);
CREATE INDEX idx_speakers_embedding ON speakers USING hnsw (embedding vector_cosine_ops);
```

**Key features:**
- **Array columns** (topics, audiences, keynotes) allow flexible tagging
- **JSONB columns** (social_profiles, social_stats) store unstructured data
- **Vector column** (embedding) stores Voyage AI embeddings for semantic search
- **HNSW index** enables fast approximate nearest-neighbor search
- **GIN index** enables full-text search fallback

#### `enquiries`
```sql
CREATE TABLE enquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    organization TEXT NOT NULL,
    phone TEXT,
    event_date TEXT,
    event_location TEXT,
    audience_size TEXT,
    budget_range TEXT,
    event_type TEXT,
    brief TEXT NOT NULL,
    speaker_id TEXT REFERENCES speakers(id) ON DELETE SET NULL,
    speaker_name TEXT,
    newsletter BOOLEAN NOT NULL DEFAULT false,
    additional_speaker_ids TEXT[] DEFAULT '{}', -- Multiple speakers selected
    currency TEXT,
    engagement_type TEXT,
    has_budget TEXT,
    recommendations JSONB DEFAULT '[]', -- AI recommendations shown during form
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'accepted', 'rejected', 'responded')),
    admin_notes TEXT,
    response_message TEXT,
    reviewed_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enquiries_status ON enquiries (status);
CREATE INDEX idx_enquiries_speaker_id ON enquiries (speaker_id);
CREATE INDEX idx_enquiries_created_at ON enquiries (created_at DESC);
```

#### `speaker_views` (Analytics)
```sql
CREATE TABLE speaker_views (
    id SERIAL PRIMARY KEY,
    speaker_id TEXT NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_speaker_views_speaker_id ON speaker_views(speaker_id);
CREATE INDEX idx_speaker_views_viewed_at ON speaker_views(viewed_at);
```

#### `speaker_recommendations` (AI Search Tracking)
```sql
CREATE TABLE speaker_recommendations (
    id SERIAL PRIMARY KEY,
    speaker_id TEXT NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    query TEXT,
    recommended_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_speaker_recs_speaker_id ON speaker_recommendations(speaker_id);
```

#### `admin_users`
```sql
CREATE TABLE admin_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.2 Query Patterns (`server/db/queries.js`)

**Pattern 1: Column aliases for camelCase conversion**
```js
const SPEAKER_COLUMNS = `
  id, name, headline, photo, bio, topics, audiences, keynotes,
  speaking_format AS "speakingFormat",
  video_url AS "videoUrl",
  featured,
  social_stats AS "socialStats",
  fee_min AS "feeMin"
`
```

**Pattern 2: Array overlap queries (related speakers)**
```js
export async function getRelatedSpeakers(speakerId, topics, limit = 4) {
  const { rows } = await pool.query(
    `SELECT ${SPEAKER_COLUMNS}
     FROM speakers
     WHERE id != $1
       AND topics && $2::text[] -- Array overlap operator
     ORDER BY array_length(
       ARRAY(SELECT unnest(topics) INTERSECT SELECT unnest($2::text[])),
       1
     ) DESC NULLS LAST
     LIMIT $3`,
    [speakerId, topics, limit]
  )
  return rows
}
```

**Pattern 3: Vector similarity search**
```js
export async function vectorSearch(queryEmbedding, limit = 12) {
  const { rows } = await pool.query(
    `SELECT ${SPEAKER_COLUMNS},
            (embedding <=> $1::vector) AS distance -- Cosine distance
     FROM speakers
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [JSON.stringify(queryEmbedding), limit]
  )
  return rows
}
```

**Pattern 4: Full-text search fallback**
```js
export async function fullTextSearch(query, limit = 8) {
  const { rows } = await pool.query(
    `SELECT ${SPEAKER_COLUMNS},
            ts_rank(
              to_tsvector('english', coalesce(name, '') || ' ' || coalesce(headline, '') || ' ' || coalesce(bio, '')),
              plainto_tsquery('english', $1)
            ) AS rank
     FROM speakers
     WHERE to_tsvector('english', coalesce(name, '') || ' ' || coalesce(headline, '') || ' ' || coalesce(bio, ''))
           @@ plainto_tsquery('english', $1)
     ORDER BY rank DESC
     LIMIT $2`,
    [query, limit]
  )
  return rows
}
```

### 4.3 Seeding (`server/db/seed.js`)

The seeding script uses **UPSERT** pattern to safely update existing data:

```js
for (const speaker of speakers) {
  await pool.query(
    `INSERT INTO speakers (id, name, headline, photo, bio, topics, audiences, keynotes, ...)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ...)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       headline = EXCLUDED.headline,
       ...
       updated_at = NOW()`,
    [speaker.id, speaker.name, speaker.headline, ...]
  )
}
```

**Why this pattern?**
- Safe to run multiple times (idempotent)
- Updates existing records rather than failing
- Preserves IDs (important for foreign key relationships)

---

## 5. AI Integration

This is where the magic happens. The platform uses **Claude AI** for semantic search and **Voyage AI** for embedding generation.

### 5.1 Semantic Search Pipeline (`server/services/claude.js`)

The system uses a **retrieve-then-rerank** architecture:

```
┌──────────────────────────────────────────────────────┐
│  1. User Query: "leadership speaker for tech summit" │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│  2. Generate Query Embedding (Voyage AI)             │
│     → 1024-dimensional vector                        │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│  3. Vector Search (PostgreSQL + pgvector)            │
│     → Find 12 nearest speaker embeddings             │
│     → Returns candidates with cosine distance        │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│  4. Rerank with Claude (LLM)                         │
│     → Send query + candidate profiles to Claude      │
│     → Claude analyzes fit and ranks by relevance     │
│     → Returns top N with reasoning and match scores  │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│  5. Return Results to User                           │
│     → Ranked speakers with AI-generated explanations │
└──────────────────────────────────────────────────────┘
```

#### Step 1: Vector Retrieval

```js
async function vectorRetrieveThenRerank(query, limit, budget) {
  // Check if embeddings are available
  const embeddingCount = await getEmbeddingCount()
  if (embeddingCount === 0 || !process.env.VOYAGE_API_KEY) {
    return null // Fall back to sending all speakers to Claude
  }

  // Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query)

  // Retrieve more candidates than needed (for reranking)
  const candidateLimit = Math.max(limit + 4, 12)
  const candidates = await vectorSearch(queryEmbedding, candidateLimit)

  if (candidates.length === 0) return null

  console.log(`Vector search found ${candidates.length} candidates`)
  // ... continue to reranking
}
```

#### Step 2: Claude Reranking

**Prompt engineering for ranking:**
```js
const SYSTEM_PROMPT = `You are a speaker recommendation engine for Flight Speakers.

Given a client's event brief and a list of speaker profiles, return the most relevant speakers ranked by fit.

Rules:
- Analyse the client's intent, audience, themes, and tone
- Rank speakers by genuine relevance to the brief — not by order presented
- Return between 1 and the requested limit of speakers, only including those with a credible match
- For each speaker, write a specific 1-2 sentence reasoning explaining the connection
- For each speaker, provide a matchScore from 0 to 100
  - Perfect topical match with relevant experience: 90-99
  - Good thematic fit: 75-89
  - Reasonable but not ideal match: 60-74
- Do not invent or fabricate details — only reference information provided
- If a client budget is provided, prefer speakers whose fee fits. Lower matchScore by 10-15 points for speakers significantly exceeding budget.
- Respond with valid JSON only

Response format:
{
  "matches": [
    { "id": "speaker-id", "reasoning": "Why this speaker matches.", "matchScore": 95 }
  ]
}`
```

**Building speaker summaries for Claude:**
```js
function buildSpeakerSummaries(speakers) {
  return speakers.map((s, i) => {
    const parts = [
      `${i + 1}. ${s.name} [id: ${s.id}]`,
      `   Headline: ${s.headline}`,
      `   Bio: ${s.bio}`,
      `   Topics: ${s.topics.join(', ')}`,
    ]
    if (s.keynotes && s.keynotes.length > 0) {
      parts.push(`   Keynotes: ${s.keynotes.join(', ')}`)
    }
    if (s.audiences && s.audiences.length > 0) {
      parts.push(`   Audiences: ${s.audiences.join(', ')}`)
    }
    if (s.feeMin != null) {
      parts.push(`   Fee Range: $${s.feeMin.toLocaleString()}+`)
    }
    return parts.join('\n')
  }).join('\n\n')
}
```

**Calling Claude:**
```js
async function callClaude(query, speakerSummaries, limit, budget) {
  const budgetLine = budget ? `\nClient budget: $${budget}\n` : ''
  const userMessage = `Client brief: "${query}"
${budgetLine}
Available speakers:

${speakerSummaries}

Return the top ${limit} most relevant speakers as JSON.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 800,
    temperature: 0.2, // Low temperature for consistent ranking
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = response.content[0].text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Claude response did not contain valid JSON')
  }

  return JSON.parse(jsonMatch[0])
}
```

**Parsing Claude's response:**
```js
const result = await callClaude(query, speakerSummaries, limit, budget)

if (!result.matches || !Array.isArray(result.matches)) {
  throw new Error('Invalid response structure')
}

const validIds = new Set(candidates.map(s => s.id))
const matchedIds = []
const reasonings = {}
const scores = {}

for (const match of result.matches) {
  if (match.id && validIds.has(match.id) && typeof match.reasoning === 'string') {
    matchedIds.push(match.id)
    reasonings[match.id] = match.reasoning
    if (typeof match.matchScore === 'number') {
      scores[match.id] = match.matchScore
    }
  }
}

// Build final speaker objects, preserving Claude's ranking
const candidateMap = new Map(candidates.map(s => [s.id, s]))
const speakers = matchedIds
  .map(id => candidateMap.get(id))
  .filter(Boolean)
  .slice(0, limit)

return { speakers, reasonings, scores }
```

### 5.2 Caching Strategy

The system uses **in-memory caching** with TTL to reduce API costs:

```js
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const CACHE_MAX_SIZE = 100

function getCacheKey(query, limit, budget) {
  return `${query.toLowerCase().trim()}:${limit}:${budget || ''}`
}

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.value
}

function setCache(key, value) {
  if (cache.size >= CACHE_MAX_SIZE) {
    const oldestKey = cache.keys().next().value
    cache.delete(oldestKey)
  }
  cache.set(key, { value, timestamp: Date.now() })
}
```

**Usage:**
```js
export async function semanticSearch(query, limit = 8, budget) {
  // Check cache first
  const cacheKey = getCacheKey(query, limit, budget)
  const cached = getCached(cacheKey)
  if (cached) return cached

  // Perform search...
  const result = await vectorRetrieveThenRerank(query, limit, budget)

  // Cache result
  setCache(cacheKey, result)
  return result
}
```

**Why cache in-memory instead of Redis?**
- Simpler deployment (no extra service)
- Low latency (no network hop)
- Sufficient for moderate traffic
- Automatically clears on restart (no stale data issues)

### 5.3 Fallback Strategy

The system has **graceful degradation** at every level:

```js
export async function semanticSearch(query, limit = 8, budget) {
  // Try vector search first
  try {
    const vectorResult = await vectorRetrieveThenRerank(query, limit, budget)
    if (vectorResult) {
      setCache(cacheKey, vectorResult)
      return vectorResult
    }
  } catch (err) {
    console.error('Vector search failed, falling back to full-speaker Claude search:', err.message)
  }

  // Fallback 1: Send all speakers to Claude (no vector search)
  const speakerProfiles = await getSpeakerProfilesForSearch()
  if (speakerProfiles.length === 0) {
    return { speakers: [], reasonings: {} }
  }

  try {
    const speakerSummaries = buildSpeakerSummaries(speakerProfiles)
    const result = await callClaude(query, speakerSummaries, limit, budget)
    // ... process result
  } catch (err) {
    console.error('Claude search failed, falling back to full-text search:', err.message)
    return fullTextFallback(query, limit)
  }

  // Fallback 2: PostgreSQL full-text search
  async function fullTextFallback(query, limit) {
    const speakers = await fullTextSearch(query, limit)

    // If full-text returns nothing, show featured speakers
    if (speakers.length === 0) {
      const featured = await getAllSpeakers({ featured: true, limit })
      const result = await generateReasoningsAndScores(query, featured)
      const reasonings = result?.reasonings ||
        Object.fromEntries(featured.map(s => [s.id, 'Featured speaker who may bring valuable perspective.']))
      return { speakers: featured, reasonings }
    }

    // Generate reasonings for full-text results
    const result = await generateReasoningsAndScores(query, speakers)
    const reasonings = result?.reasonings ||
      Object.fromEntries(speakers.map(s => [s.id, 'Matched based on relevance to your search.']))
    return { speakers, reasonings }
  }
}
```

**Fallback hierarchy:**
1. **Vector search + Claude rerank** (best quality, fastest)
2. **Send all speakers to Claude** (good quality, slower)
3. **PostgreSQL full-text search** (decent quality, fast)
4. **Featured speakers** (always returns something)

### 5.4 Brief Parsing (`server/routes/parseBrief.js`)

The system uses **Claude Haiku** (fast, cheap) to extract structured data:

**Input:**
```
"I need a leadership speaker for 500 executives at our June conference in London. Budget is around £30k."
```

**Output:**
```json
{
  "extracted": {
    "eventType": "Conference / Summit",
    "eventDate": "2026-06-15",
    "eventLocation": "London",
    "audienceSize": "500",
    "engagementType": "Paid",
    "budgetRange": "$25,000 - $50,000"
  }
}
```

**Key techniques:**
- **Constraint extraction** (only return confident fields)
- **Enum validation** (eventType must match predefined list)
- **Cross-currency mapping** (£30k → $25k-$50k range)
- **JSON-only responses** (easy to parse)

---

## 6. Admin Dashboard

The admin dashboard is a **separate single-page app** mounted at `/admin/*` with JWT authentication.

### 6.1 Structure (`src/admin/AdminApp.jsx`)

```jsx
export default function AdminApp() {
  const { user, isLoading, isAuthenticated, login, logout } = useAdminAuth()

  if (isLoading) {
    return <div className="admin-loading">Loading...</div>
  }

  if (!isAuthenticated) {
    return <AdminLoginPage onLogin={login} />
  }

  return (
    <Routes>
      <Route element={<AdminLayout user={user} onLogout={logout} />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="enquiries" element={<AdminEnquiriesPage />} />
        <Route path="enquiries/:id" element={<AdminEnquiryDetailPage />} />
        <Route path="speakers" element={<AdminSpeakersPage />} />
        <Route path="speakers/:id" element={<AdminSpeakerDetailPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
    </Routes>
  )
}
```

### 6.2 Authentication Flow (`src/admin/hooks/useAdminAuth.js`)

**Pattern: Fetch on mount, verify session**
```js
export function useAdminAuth() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if already logged in
    fetch('/api/admin/me')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (username, password) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (data.success) {
      setUser(data.user)
      return { success: true }
    }
    return { success: false, message: data.message }
  }

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    setUser(null)
  }

  return { user, isLoading, isAuthenticated: !!user, login, logout }
}
```

**Security:**
- JWT stored in httpOnly cookie (not accessible to JavaScript)
- Cookie automatically sent with every request (no need to manually attach headers)
- Token verified on server side for every protected route

### 6.3 Analytics Queries (`server/db/enquiry-queries.js`)

**Complex analytics with CTEs and window functions:**

```sql
-- Speaker analytics with conversion rates
SELECT s.id, s.name, s.photo, s.headline, s.featured,
  s.fee_min,
  COALESCE(v.view_count, 0) AS views,
  COALESCE(e.enquiry_count, 0) AS enquiries,
  COALESCE(r.rec_count, 0) AS recommendations,
  COALESCE(a.added_count, 0) AS added_as_extra,
  CASE WHEN COALESCE(v.view_count, 0) > 0
    THEN ROUND(COALESCE(e.enquiry_count, 0)::numeric / v.view_count * 100, 1)
    ELSE 0 END AS conversion_rate,
  ai.avg_score AS avg_ai_score
FROM speakers s
LEFT JOIN (
  SELECT speaker_id, COUNT(*) AS view_count FROM speaker_views GROUP BY speaker_id
) v ON v.speaker_id = s.id
LEFT JOIN (
  SELECT speaker_id, COUNT(*) AS enquiry_count FROM enquiries WHERE speaker_id IS NOT NULL GROUP BY speaker_id
) e ON e.speaker_id = s.id
LEFT JOIN (
  SELECT speaker_id, COUNT(*) AS rec_count FROM speaker_recommendations GROUP BY speaker_id
) r ON r.speaker_id = s.id
LEFT JOIN (
  SELECT aid AS speaker_id, COUNT(*) AS added_count
  FROM enquiries, unnest(additional_speaker_ids) AS aid
  GROUP BY aid
) a ON a.speaker_id = s.id
LEFT JOIN LATERAL (
  SELECT ROUND(AVG((rec->>'score')::numeric)) AS avg_score
  FROM enquiries eq, jsonb_array_elements(eq.recommendations) AS rec
  WHERE rec->>'speakerId' = s.id AND (rec->>'score') IS NOT NULL
) ai ON true
ORDER BY enquiries DESC, views DESC
```

**What this query does:**
- Counts views per speaker
- Counts enquiries where speaker was requested
- Counts AI recommendations
- Counts times added as "additional speaker"
- Calculates conversion rate (enquiries / views)
- Extracts average AI match score from JSONB

**Why this pattern?**
- **Lateral joins** allow correlated subqueries (accessing `s.id` in the subquery)
- **JSONB functions** (`jsonb_array_elements`) unnest recommendation arrays
- **COALESCE** provides default values for speakers with no data
- **Left joins** ensure all speakers appear in results (even with 0 stats)

---

## 7. Key Patterns

These are recurring patterns you'll see throughout the codebase. Learn them, as they apply to many projects.

### 7.1 Caching

**Pattern: Check cache → fetch if miss → store result**
```js
const cached = getCached(key)
if (cached) return cached

const result = await expensiveOperation()
setCache(key, result)
return result
```

**Used in:**
- Semantic search results (5-minute TTL)
- Brief parsing (persistent across page loads)
- Speaker data prefetching (enquiry form)

### 7.2 Prefetching

**Pattern: Start loading data before it's needed**

```js
// Link hover → prefetch destination
<Link
  to={`/speakers/${speaker.id}`}
  onMouseEnter={() => prefetchSpeaker(speaker.id)}
>
  {speaker.name}
</Link>

// Prefetch function stores promise in cache
export function prefetchSpeaker(speakerId) {
  const key = `speaker:${speakerId}`
  if (cache.has(key)) return

  const promise = fetch(`/api/speakers/${encodeURIComponent(speakerId)}`)
    .then(res => res.json())
    .then(data => data.success ? data.speaker : null)
    .catch(() => null)

  cache.set(key, promise)
}

// Consumer checks cache first
const cached = await getCachedSpeaker(speakerId)
if (cached) {
  // Use cached data instantly
}
```

**Why this works:**
- By the time user clicks, data is already loaded
- No loading spinners on navigation
- Perceived performance boost

### 7.3 Error Handling

**Pattern: Graceful degradation with fallbacks**

```js
try {
  // Try best approach
  const result = await vectorSearch(query)
  if (result) return result
} catch (err) {
  console.error('Vector search failed:', err.message)
}

try {
  // Fallback to second-best approach
  const result = await claudeFullSearch(query)
  if (result) return result
} catch (err) {
  console.error('Claude search failed:', err.message)
}

// Final fallback: always works
return await postgresFullTextSearch(query)
```

**Why this pattern?**
- User never sees error screens
- System stays operational even when AI services are down
- Logging helps debug issues in production

### 7.4 Animation Patterns

**Pattern: Consistent easing + duration**

```js
const EASE = [0.16, 1, 0.3, 1] // Smooth easing curve

// All animations use same easing
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: EASE }}
>
```

**Why consistency matters:**
- Creates a cohesive feel across the app
- Users subconsciously recognize patterns
- Easier to maintain (change once, affects everywhere)

### 7.5 Form State Management

**Pattern: Custom hook encapsulates complex state**

```js
// Hook manages all form complexity
const form = useMultiStepForm({ initialData, speaker })

// Component just consumes clean API
const {
  formData,
  currentStep,
  errors,
  handleChange,
  goNext,
  goBack,
  submitForm,
} = form
```

**Benefits:**
- Logic is testable in isolation
- Component stays clean and declarative
- Easy to reuse across different forms

### 7.6 Fire-and-Forget Analytics

**Pattern: Track events without blocking user flow**

```js
// Fire-and-forget: don't await, don't block on errors
pool.query('INSERT INTO speaker_views (speaker_id) VALUES ($1)', [req.params.id])
  .catch(err => console.error('Failed to track view:', err.message))

// User gets response immediately
res.json({ success: true, speaker })
```

**Why this pattern?**
- Analytics never slow down user experience
- Failures don't break the main flow
- Database bottlenecks don't cascade

---

## 8. Dev Setup

### 8.1 Prerequisites

- **Node.js 20+** (required for ES modules and latest features)
- **Docker** (for PostgreSQL + pgvector)
- **API keys:**
  - `ANTHROPIC_API_KEY` (for Claude AI)
  - `VOYAGE_API_KEY` (for embeddings, optional)

### 8.2 Environment Variables

Create a `.env` file in the project root:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flight_speakers

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...  # Optional: enables vector search

# Server
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Auth
JWT_SECRET=your-secure-random-secret-change-in-production

# Notifications (optional)
KLAVIYO_API_KEY=...
```

### 8.3 First-Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL with Docker
npm run db:start

# Wait ~10 seconds for database to initialize, then:

# 3. Run database schema setup (manually or via psql)
docker exec -i flight-speakers-db psql -U postgres -d flight_speakers < server/db/init.sql

# 4. Seed speakers
npm run db:seed

# 5. (Optional) Generate embeddings for semantic search
npm run db:embed

# 6. (Optional) Seed test enquiries
npm run db:seed-enquiries
```

### 8.4 Running the App

**Development (two terminals):**

```bash
# Terminal 1: Vite dev server (React)
npm run dev
# → http://localhost:5173

# Terminal 2: Express API server
npm run server
# → http://localhost:3001
```

**Or run both concurrently:**
```bash
npm run dev:all
```

### 8.5 Database Management

```bash
# Start database
npm run db:start

# Stop database
npm run db:stop

# Reset database (stop + remove volumes, then start fresh)
docker compose down -v
npm run db:start
# Re-run init.sql and seeds
```

### 8.6 Useful Scripts

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "server": "node --env-file=.env server/index.js",
  "dev:all": "concurrently \"npm run dev\" \"npm run server\"",
  "db:start": "docker compose up -d",
  "db:stop": "docker compose down",
  "db:seed": "node --env-file=.env server/db/seed.js",
  "db:embed": "node --env-file=.env server/db/seed-embeddings.js",
  "db:seed-enquiries": "node --env-file=.env server/db/seed-enquiries.js"
}
```

### 8.7 Docker Compose (PostgreSQL)

The project includes a `docker-compose.yml` for local development:

```yaml
services:
  db:
    image: ankane/pgvector:latest  # PostgreSQL 16 + pgvector
    container_name: flight-speakers-db
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: flight_speakers
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Why pgvector via Docker?**
- No need to compile pgvector extension locally
- Consistent environment across team members
- Easy to reset and start fresh

### 8.8 Accessing the Admin Dashboard

1. **Create an admin user** (via psql or a seed script):
```sql
-- Hash generated with bcrypt (password: "admin")
INSERT INTO admin_users (id, username, password_hash)
VALUES (
  'admin-001',
  'admin',
  '$2b$10$examplehashgoeshere...'
);
```

2. **Navigate to** `http://localhost:5173/admin`

3. **Login** with your credentials

4. **Explore:**
   - Dashboard → analytics overview
   - Enquiries → manage enquiries, update status, view AI recommendations
   - Speakers → view analytics, edit fees, delete speakers

---

## Final Thoughts

This codebase demonstrates several modern patterns:

1. **AI as a first-class feature** — not bolted on, but core to the product
2. **Graceful degradation** — always return something useful
3. **Performance-first** — caching, prefetching, and efficient queries
4. **Clean separation** — frontend, backend, and database are loosely coupled
5. **Real-world patterns** — JWT auth, vector search, multi-step forms, admin dashboards

As a junior developer, focus on understanding **why** these patterns exist, not just **what** they do. Every choice (from BEM CSS to fire-and-forget analytics) solves a specific problem.

If you're stuck on any concept, break it down:
1. What problem does this solve?
2. What would happen without it?
3. What are the tradeoffs?

Keep building, keep learning, and use this codebase as a reference for your next project.

---

**Happy coding!**
