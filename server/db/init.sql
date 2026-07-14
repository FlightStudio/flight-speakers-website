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
    embedding vector(1024),
    boost_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
    is_speakers_agency BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'calendar_meeting', 'confirmed', 'contract_sent', 'closed_won', 'closed_lost', 'paid_in_full', 'rejected')),
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

-- Hero media type
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS hero_media_type TEXT NOT NULL DEFAULT 'image' CHECK (hero_media_type IN ('image','video'));

-- Social media columns on speakers
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS social_profiles JSONB DEFAULT '{}';
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS social_stats JSONB DEFAULT '{}';
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS social_stats_updated_at TIMESTAMPTZ;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS books JSONB NOT NULL DEFAULT '[]'::jsonb;

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
    prefill_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_speaker_tokens_token ON speaker_tokens(token);

-- Rejection reason for rejected enquiries
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Response templates for enquiry rejections
CREATE TABLE IF NOT EXISTS response_templates (
    id TEXT PRIMARY KEY,
    reason_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO response_templates (id, reason_key, label, subject, body) VALUES
  ('tmpl_accepted', 'accepted', 'Accepted', 'Great news about your enquiry',
   E'Hi {{name}},\n\nGreat news! We are pleased to confirm that {{speaker_name}} is available for your event on {{event_date}}.\n\nA member of our team will be in touch shortly to discuss next steps and finalise the details.\n\nWe look forward to working with you.\n\nKind regards,\nFlight Speakers'),
  ('tmpl_pro_bono', 'pro_bono', 'Pro Bono', 'Regarding your enquiry',
   E'Hi {{name}},\n\nThank you for your interest in booking {{speaker_name}} for your event on {{event_date}}.\n\nUnfortunately, {{speaker_name}} is unable to take on pro bono engagements at this time.\n\nWe appreciate your understanding and wish you all the best with your event.\n\nKind regards,\nFlight Speakers'),
  ('tmpl_no_availability', 'no_availability', 'No Availability', 'Regarding your enquiry',
   E'Hi {{name}},\n\nThank you for your interest in booking {{speaker_name}} for your event on {{event_date}}.\n\nUnfortunately, {{speaker_name}} is not available for the requested date. We would be happy to suggest alternative speakers who may be a great fit.\n\nPlease let us know if you would like us to look into this for you.\n\nKind regards,\nFlight Speakers'),
  ('tmpl_exclusivity', 'exclusivity', 'Exclusivity', 'Regarding your enquiry',
   E'Hi {{name}},\n\nThank you for your interest in booking {{speaker_name}} for your event on {{event_date}}.\n\nDue to existing exclusivity arrangements, {{speaker_name}} is unable to participate in this engagement at this time.\n\nWe would be happy to suggest alternative speakers if that would be helpful.\n\nKind regards,\nFlight Speakers')
ON CONFLICT (reason_key) DO NOTHING;

-- Speaker waitlist (prospective speakers applying to join the roster)
CREATE TABLE IF NOT EXISTS speaker_waitlist (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  based_in TEXT NOT NULL,
  title_company TEXT NOT NULL,
  speaks_about TEXT NOT NULL,
  topics TEXT[] NOT NULL DEFAULT '{}',
  speaking_experience TEXT NOT NULL,
  fee_currency TEXT NOT NULL,
  fee_bracket TEXT NOT NULL,
  website TEXT,
  linkedin TEXT,
  showreel TEXT,
  instagram TEXT,
  notable_engagements TEXT,
  representation_status TEXT NOT NULL,
  why_flightspeakers TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'invited', 'declined')),
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  invited_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_speaker_waitlist_status ON speaker_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_speaker_waitlist_created ON speaker_waitlist(created_at DESC);

-- AI-generated article drafts
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Rankings',
  excerpt TEXT NOT NULL,
  image TEXT,
  image_credit TEXT,
  tile_c1 TEXT,
  tile_c2 TEXT,
  body JSONB NOT NULL,
  read_time INT NOT NULL DEFAULT 8,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','rejected')),
  generated_by TEXT NOT NULL DEFAULT 'auto' CHECK (generated_by IN ('auto','manual','seed')),
  topic_angle TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC) WHERE status = 'published';

-- Log of transactional emails sent per enquiry
CREATE TABLE IF NOT EXISTS sent_emails (
  id SERIAL PRIMARY KEY,
  enquiry_id TEXT REFERENCES enquiries(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  recipient TEXT NOT NULL,
  resend_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sent_emails_enquiry ON sent_emails(enquiry_id);
