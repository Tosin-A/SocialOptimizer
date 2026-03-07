-- Outlier posts
CREATE TABLE IF NOT EXISTS outlier_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  competitor_post_id UUID DEFAULT NULL,
  source TEXT NOT NULL DEFAULT 'own' CHECK (source IN ('own', 'competitor')),
  multiplier NUMERIC(5,1) NOT NULL DEFAULT 1.0,
  pattern_tags TEXT[] DEFAULT '{}',
  what_worked TEXT DEFAULT '',
  is_saved BOOLEAN NOT NULL DEFAULT FALSE,
  platform TEXT NOT NULL,
  caption TEXT,
  engagement_rate NUMERIC(10,6) DEFAULT 0,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE outlier_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own outliers" ON outlier_posts FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Trends
CREATE TABLE IF NOT EXISTS trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  trend_type TEXT NOT NULL CHECK (trend_type IN ('sound', 'hashtag', 'format', 'topic')),
  name TEXT NOT NULL,
  velocity_score INTEGER DEFAULT 0,
  saturation TEXT DEFAULT 'low' CHECK (saturation IN ('low', 'medium', 'high')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read trends" ON trends FOR SELECT USING (auth.uid() IS NOT NULL);

-- Niche saturation
CREATE TABLE IF NOT EXISTS niche_saturation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  niche TEXT NOT NULL,
  active_creators INTEGER DEFAULT 0,
  avg_engagement_rate NUMERIC(10,6) DEFAULT 0,
  trend_direction TEXT DEFAULT 'stable' CHECK (trend_direction IN ('growing', 'stable', 'declining')),
  verdict TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE niche_saturation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read saturation" ON niche_saturation FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert saturation" ON niche_saturation FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
