CREATE TABLE IF NOT EXISTS saved_ideas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  provider      TEXT NOT NULL DEFAULT 'claude',
  platform      TEXT,
  niche         TEXT,
  source_prompt TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saved_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_saved_ideas" ON saved_ideas
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
