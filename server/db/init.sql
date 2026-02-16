-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Speakers table
CREATE TABLE IF NOT EXISTS speakers (
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
    embedding vector(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for featured speaker queries
CREATE INDEX IF NOT EXISTS idx_speakers_featured ON speakers (featured) WHERE featured = true;

-- Full-text search index as fallback
CREATE INDEX IF NOT EXISTS idx_speakers_fts ON speakers USING gin (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(headline, '') || ' ' || coalesce(bio, ''))
);

-- HNSW index for future vector similarity search
CREATE INDEX IF NOT EXISTS idx_speakers_embedding ON speakers USING hnsw (embedding vector_cosine_ops);

-- Enquiries table
CREATE TABLE IF NOT EXISTS enquiries (
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
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'accepted', 'rejected', 'responded')),
    admin_notes TEXT,
    response_message TEXT,
    reviewed_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries (status);
CREATE INDEX IF NOT EXISTS idx_enquiries_speaker_id ON enquiries (speaker_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries (created_at DESC);

-- Social media columns on speakers
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS social_profiles JSONB DEFAULT '{}';
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS social_stats JSONB DEFAULT '{}';
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS social_stats_updated_at TIMESTAMPTZ;

-- Speaker view tracking
CREATE TABLE IF NOT EXISTS speaker_views (
    id SERIAL PRIMARY KEY,
    speaker_id TEXT NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_speaker_views_speaker_id ON speaker_views(speaker_id);
CREATE INDEX IF NOT EXISTS idx_speaker_views_viewed_at ON speaker_views(viewed_at);

-- Additional enquiry fields for multi-step form
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS additional_speaker_ids TEXT[] DEFAULT '{}';
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS engagement_type TEXT;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS has_budget TEXT;

-- Pro bono flexible flag
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS pro_bono_flexible BOOLEAN DEFAULT false;

-- Speaker fee column
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS fee_min INTEGER;

-- Store AI recommendations shown during enquiry form
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS recommendations JSONB DEFAULT '[]';

-- Speaker recommendation tracking
CREATE TABLE IF NOT EXISTS speaker_recommendations (
    id SERIAL PRIMARY KEY,
    speaker_id TEXT NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    query TEXT,
    recommended_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_speaker_recs_speaker_id ON speaker_recommendations(speaker_id);
CREATE INDEX IF NOT EXISTS idx_speaker_recs_at ON speaker_recommendations(recommended_at);

-- Speaker demographic columns
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS location TEXT;

-- Speaker drafts / review queue
CREATE TABLE IF NOT EXISTS speaker_drafts (
    id SERIAL PRIMARY KEY,
    speaker_id TEXT REFERENCES speakers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('new', 'update')),
    data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_speaker_drafts_status ON speaker_drafts(status);
CREATE INDEX IF NOT EXISTS idx_speaker_drafts_type ON speaker_drafts(type);

-- Speaker invite tokens (magic links)
CREATE TABLE IF NOT EXISTS speaker_tokens (
    id SERIAL PRIMARY KEY,
    speaker_id TEXT REFERENCES speakers(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('new', 'update')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_speaker_tokens_token ON speaker_tokens(token);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
