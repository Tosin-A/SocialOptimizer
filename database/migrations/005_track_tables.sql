-- Experiments
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hypothesis TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'cancelled')),
  baseline_metrics JSONB DEFAULT '{}',
  result_metrics JSONB DEFAULT '{}',
  tagged_post_ids UUID[] DEFAULT '{}',
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own experiments" ON experiments FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Win Library
CREATE TABLE IF NOT EXISTS win_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outlier_post_id UUID REFERENCES outlier_posts(id) ON DELETE SET NULL,
  source TEXT DEFAULT '',
  platform TEXT NOT NULL,
  tag TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE win_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own wins" ON win_library FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Score Annotations
CREATE TABLE IF NOT EXISTS score_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES analysis_reports(id) ON DELETE SET NULL,
  experiment_id UUID REFERENCES experiments(id) ON DELETE SET NULL,
  annotation_type TEXT NOT NULL DEFAULT 'analysis' CHECK (annotation_type IN ('analysis', 'experiment_start', 'experiment_end')),
  label TEXT DEFAULT '',
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE score_annotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own annotations" ON score_annotations FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
