# Flight Story Speakers

A modern, AI-powered speaker bureau website that disrupts traditional speaker bureaus with clean UX and intelligent speaker matching.

## Features

- **AI-Powered Search**: Natural language search that matches event briefs to speakers
- **Curated Roster**: 16 hand-picked speakers with detailed profiles
- **Video-First Profiles**: Every speaker has embedded video content
- **Smart Enquiry System**: Contextual forms that capture event details
- **Premium UX**: Clean, modern design built for conversion

## Tech Stack

- **Frontend**: React 19 + Vite
- **Backend**: Express.js
- **Styling**: Custom CSS with design system
- **Routing**: React Router v7

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Start development server (frontend)
npm run dev

# Start backend server
npm run server

# Or run both concurrently
npm run dev:all
```

### URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

## Project Structure

```
flight-speakers-website/
├── src/
│   ├── components/
│   │   ├── common/          # Shared UI components
│   │   ├── forms/           # Form components (EnquiryForm)
│   │   ├── layout/          # Header, Footer, Layout
│   │   ├── search/          # AI search bar
│   │   └── speakers/        # Speaker cards and grid
│   ├── pages/
│   │   ├── HomePage.jsx     # Landing page with hero + grid
│   │   ├── SpeakerDetailPage.jsx
│   │   ├── SearchResultsPage.jsx
│   │   ├── EnquiryPage.jsx
│   │   └── AboutPage.jsx
│   ├── data/
│   │   └── speakers.js      # Speaker data (16 speakers)
│   ├── utils/
│   │   └── aiMatching.js    # AI matching algorithm
│   └── styles/
│       └── index.css        # Global styles + design system
├── server/
│   ├── index.js             # Express server entry
│   ├── routes/
│   │   ├── speakers.js      # GET speakers, filter, details
│   │   ├── search.js        # AI-powered search endpoint
│   │   └── enquiry.js       # POST enquiries
│   ├── data/
│   │   └── speakers.js      # Server-side speaker data
│   └── utils/
│       └── aiMatching.js    # Server-side matching
└── public/
    └── favicon.svg
```

## API Endpoints

### Speakers
- `GET /api/speakers` - List all speakers (supports `?featured=true`, `?topic=...`, `?limit=n`)
- `GET /api/speakers/:id` - Get speaker by ID with related speakers
- `GET /api/speakers/meta/topics` - Get all topics
- `GET /api/speakers/meta/audiences` - Get all audiences

### Search
- `GET /api/search?q=...` - AI-powered speaker matching
- `GET /api/search/suggest?q=...` - Search suggestions

### Enquiries
- `POST /api/enquiry` - Submit an enquiry
- `GET /api/enquiry` - List all enquiries (admin)

### Health
- `GET /api/health` - Server health check

## AI Matching System

The AI matching system uses keyword extraction and topic mapping to match natural language queries to speakers. It considers:

- **Topic Relevance**: Matches query keywords to speaker topics
- **Audience Fit**: Considers target audiences mentioned
- **Bio Analysis**: Searches speaker bios for relevant terms
- **Featured Boost**: Prioritizes featured speakers

Example queries:
- "500 women in business conference in Boston"
- "AI keynote for tech leadership summit"
- "Wellness speaker for corporate retreat"

## Design System

The CSS uses custom properties for consistent theming:

```css
--color-accent: #6366f1;        /* Primary accent */
--color-bg-primary: #fafafa;    /* Page background */
--color-bg-dark: #1a1a2e;       /* Dark sections */
--radius-lg: 12px;              /* Card corners */
--shadow-lg: ...;               /* Elevation */
```

## Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run server` - Start Express backend
- `npm run dev:all` - Run frontend + backend

## Next Steps

See [NEXT_PHASE_IMPROVEMENTS.md](./NEXT_PHASE_IMPROVEMENTS.md) for detailed roadmap including:

- Real AI/vector search integration
- CMS integration (Sanity/Contentful)
- Klaviyo CRM integration
- Analytics implementation
- Admin dashboard
- And more...

## Environment Variables (Production)

```env
# Email (for enquiries)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=

# Klaviyo
KLAVIYO_API_KEY=

# OpenAI (for real AI search)
OPENAI_API_KEY=

# Analytics
GA_MEASUREMENT_ID=
```

## License

Private - Flight Story
