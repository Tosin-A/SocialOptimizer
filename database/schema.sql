-- ════════════════════════════════════════════════════════════════════════════════
-- SocialOptimizer — Complete Database Schema
-- PostgreSQL 15+ / Supabase
-- ════════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ─── ENUMS ────────────────────────────────────────────────────────────────────

CREATE TYPE platform_type AS ENUM ('tiktok', 'instagram', 'youtube', 'facebook');
CREATE TYPE content_type  AS ENUM ('video', 'reel', 'short', 'post', 'story', 'live');
CREATE TYPE job_status    AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE plan_type     AS ENUM ('free', 'starter', 'pro', 'agency');
CREATE TYPE insight_type  AS ENUM ('strength', 'weakness', 'opportunity', 'threat');
CREATE TYPE sentiment     AS ENUM ('positive', 'neutral', 'negative');

-- ─── USERS & BILLING ──────────────────────────────────────────────────────────

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id         UUID UNIQUE NOT NULL,          -- Supabase auth.users.id
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  plan            plan_type NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  analyses_used   INT NOT NULL DEFAULT 0,
  analyses_limit  INT NOT NULL DEFAULT 3,        -- Free: 3/month, Pro: unlimited
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: users can only see/edit their own row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_self" ON users
  FOR ALL USING (auth.uid() = auth_id);

-- ─── CONNECTED PLATFORM ACCOUNTS ─────────────────────────────────────────────

CREATE TABLE connected_accounts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform         platform_type NOT NULL,
  platform_user_id TEXT NOT NULL,               -- platform's native ID
  username         TEXT NOT NULL,
  display_name     TEXT,
  avatar_url       TEXT,
  followers        INT,
  following        INT,
  access_token     TEXT NOT NULL,               -- encrypted at rest via pgcrypto
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes           TEXT[],
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform, platform_user_id)
);

ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_owner" ON connected_accounts
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE INDEX idx_connected_accounts_user ON connected_accounts(user_id);
CREATE INDEX idx_connected_accounts_platform ON connected_accounts(platform);

-- ─── RAW POSTS / CONTENT ──────────────────────────────────────────────────────

CREATE TABLE posts (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id           UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  platform_post_id     TEXT NOT NULL,
  content_type         content_type NOT NULL,
  caption              TEXT,
  hashtags             TEXT[],
  mentions             TEXT[],
  media_url            TEXT,
  thumbnail_url        TEXT,
  duration_seconds     INT,
  likes                BIGINT DEFAULT 0,
  comments             BIGINT DEFAULT 0,
  shares               BIGINT DEFAULT 0,
  saves                BIGINT DEFAULT 0,
  views                BIGINT DEFAULT 0,
  reach                BIGINT DEFAULT 0,
  engagement_rate      DECIMAL(6,4),            -- (likes+comments+shares) / reach
  posted_at            TIMESTAMPTZ NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, platform_post_id)
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_owner" ON posts
  FOR ALL USING (
    account_id IN (
      SELECT ca.id FROM connected_accounts ca
      JOIN users u ON u.id = ca.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE INDEX idx_posts_account ON posts(account_id);
CREATE INDEX idx_posts_posted_at ON posts(posted_at DESC);
CREATE INDEX idx_posts_engagement ON posts(engagement_rate DESC);
CREATE INDEX idx_posts_hashtags ON posts USING GIN(hashtags);

-- ─── ANALYSIS JOBS ────────────────────────────────────────────────────────────

CREATE TABLE analysis_jobs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id       UUID NOT NULL REFERENCES connected_accounts(id),
  status           job_status NOT NULL DEFAULT 'pending',
  progress         INT NOT NULL DEFAULT 0,      -- 0–100
  current_step     TEXT,                        -- human-readable current step
  posts_fetched    INT DEFAULT 0,
  posts_analyzed   INT DEFAULT 0,
  error_message    TEXT,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_owner" ON analysis_jobs
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE INDEX idx_jobs_user ON analysis_jobs(user_id);
CREATE INDEX idx_jobs_status ON analysis_jobs(status);

-- ─── FULL ANALYSIS REPORTS ────────────────────────────────────────────────────

CREATE TABLE analysis_reports (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id                    UUID NOT NULL REFERENCES analysis_jobs(id),
  account_id                UUID NOT NULL REFERENCES connected_accounts(id),
  user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Core scores (0–100)
  growth_score              INT,
  content_quality_score     INT,
  hashtag_score             INT,
  engagement_score          INT,
  consistency_score         INT,
  branding_score            INT,
  hook_strength_score       INT,
  cta_score                 INT,

  -- Niche detection
  detected_niche            TEXT,
  niche_confidence          DECIMAL(4,3),       -- 0.000 – 1.000
  niche_keywords            TEXT[],
  content_themes            JSONB,              -- [{theme, frequency, engagement_rate}]

  -- Hashtag analysis
  hashtag_effectiveness     JSONB,              -- [{tag, reach_score, competition, recommendation}]
  recommended_hashtags      TEXT[],
  overused_hashtags         TEXT[],
  underused_hashtags        TEXT[],

  -- Posting patterns
  avg_posts_per_week        DECIMAL(5,2),
  best_days                 TEXT[],             -- ['Monday', 'Thursday']
  best_hours                INT[],              -- [18, 19, 20] (UTC hour)
  posting_consistency       DECIMAL(4,3),

  -- Engagement metrics
  avg_engagement_rate       DECIMAL(6,4),
  avg_likes                 BIGINT,
  avg_comments              BIGINT,
  avg_shares                BIGINT,
  avg_views                 BIGINT,
  top_performing_formats    content_type[],

  -- Content quality
  avg_hook_score            DECIMAL(4,3),
  cta_usage_rate            DECIMAL(4,3),
  caption_sentiment         sentiment,
  avg_caption_length        INT,

  -- AI-generated insights
  strengths                 JSONB,              -- [{title, description, impact:'high'|'medium'|'low'}]
  weaknesses                JSONB,
  opportunities             JSONB,
  improvement_roadmap       JSONB,              -- [{priority, action, expected_impact, timeframe}]
  executive_summary         TEXT,

  -- Top & worst posts
  top_posts                 JSONB,              -- [{post_id, reason, metric}]
  worst_posts               JSONB,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_owner" ON analysis_reports
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE INDEX idx_reports_user ON analysis_reports(user_id);
CREATE INDEX idx_reports_account ON analysis_reports(account_id);
CREATE INDEX idx_reports_created ON analysis_reports(created_at DESC);

-- ─── POST-LEVEL ANALYSIS ──────────────────────────────────────────────────────

CREATE TABLE post_analyses (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  report_id         UUID NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,

  -- AI analysis results
  hook_score        DECIMAL(4,3),
  hook_text         TEXT,                       -- first line / opening words
  hook_type         TEXT,                       -- 'question'|'statement'|'stat'|'story'
  cta_detected      BOOLEAN,
  cta_text          TEXT,
  sentiment_score   DECIMAL(4,3),              -- -1 to +1
  sentiment_label   sentiment,
  topics            TEXT[],
  keywords          TEXT[],
  transcript        TEXT,                       -- Whisper output
  readability_score DECIMAL(5,2),

  -- Visual analysis
  visual_categories TEXT[],                    -- ['outdoor','fitness','food']
  dominant_colors   TEXT[],                    -- hex codes
  has_text_overlay  BOOLEAN,
  has_face          BOOLEAN,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_analyses_post ON post_analyses(post_id);
CREATE INDEX idx_post_analyses_report ON post_analyses(report_id);

-- ─── COMPETITOR TRACKING ──────────────────────────────────────────────────────

CREATE TABLE competitors (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform           platform_type NOT NULL,
  platform_user_id   TEXT NOT NULL,
  username           TEXT NOT NULL,
  display_name       TEXT,
  avatar_url         TEXT,
  followers          BIGINT,
  niche              TEXT,
  avg_engagement_rate DECIMAL(6,4),
  posts_per_week     DECIMAL(5,2),
  top_hashtags       TEXT[],
  content_formats    content_type[],
  last_analyzed_at   TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform, platform_user_id)
);

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitors_owner" ON competitors
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE TABLE competitor_posts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id     UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  platform_post_id  TEXT NOT NULL,
  content_type      content_type,
  caption           TEXT,
  hashtags          TEXT[],
  likes             BIGINT DEFAULT 0,
  comments          BIGINT DEFAULT 0,
  shares            BIGINT DEFAULT 0,
  views             BIGINT DEFAULT 0,
  engagement_rate   DECIMAL(6,4),
  hook_text         TEXT,
  posted_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (competitor_id, platform_post_id)
);

CREATE INDEX idx_competitor_posts_competitor ON competitor_posts(competitor_id);

-- ─── COMPETITOR COMPARISON REPORTS ───────────────────────────────────────────

CREATE TABLE competitor_comparisons (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id             UUID REFERENCES analysis_reports(id),
  competitor_id         UUID NOT NULL REFERENCES competitors(id),

  -- Gaps (negative = user is behind, positive = user is ahead)
  engagement_gap        DECIMAL(6,4),
  follower_gap          BIGINT,
  posting_frequency_gap DECIMAL(5,2),

  -- Tactical differences
  hashtag_differences   JSONB,                 -- [{hashtag, competitor_uses, user_uses}]
  format_differences    JSONB,
  hook_style_differences TEXT,
  caption_length_diff   INT,

  -- Recommendations
  tactical_actions      JSONB,                 -- [{action, priority, rationale}]

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE competitor_comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comparisons_owner" ON competitor_comparisons
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ─── GENERATED CONTENT ────────────────────────────────────────────────────────

CREATE TABLE generated_content (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id      UUID REFERENCES connected_accounts(id),
  platform        platform_type,
  content_type    TEXT NOT NULL,                -- 'hook'|'caption'|'script'|'hashtags'|'idea'
  prompt_context  JSONB,                        -- niche, style, topic inputs
  output          JSONB NOT NULL,               -- structured generated content
  is_saved        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "generated_owner" ON generated_content
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE INDEX idx_generated_user ON generated_content(user_id);

-- ─── NICHE BENCHMARKS (Platform averages — populated by system) ───────────────

CREATE TABLE niche_benchmarks (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform                platform_type NOT NULL,
  niche                   TEXT NOT NULL,
  avg_engagement_rate     DECIMAL(6,4),
  avg_posts_per_week      DECIMAL(5,2),
  median_follower_count   BIGINT,
  top_content_types       content_type[],
  top_hashtags            TEXT[],
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (platform, niche)
);

-- ─── AUDIT / USAGE LOG ────────────────────────────────────────────────────────

CREATE TABLE usage_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,                    -- 'analysis_run'|'content_generated'|'competitor_added'
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_events_user ON usage_events(user_id);
CREATE INDEX idx_usage_events_type ON usage_events(event_type);

-- ─── FUNCTIONS & TRIGGERS ─────────────────────────────────────────────────────

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON connected_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (auth_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Compute engagement rate on post upsert
CREATE OR REPLACE FUNCTION compute_engagement_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reach > 0 THEN
    NEW.engagement_rate = (
      COALESCE(NEW.likes, 0) +
      COALESCE(NEW.comments, 0) +
      COALESCE(NEW.shares, 0)
    )::DECIMAL / NEW.reach;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_engagement_rate
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION compute_engagement_rate();
