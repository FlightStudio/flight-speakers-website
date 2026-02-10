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
