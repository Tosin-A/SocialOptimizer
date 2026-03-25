-- 012: Share growth loop — bonus analyses from sharing reports
-- Users earn 3 bonus analyses per report shared (one-time per report)

-- New columns on users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bonus_analyses INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_shares INT NOT NULL DEFAULT 0;

-- Share token on reports for fast public lookups
ALTER TABLE analysis_reports
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Report shares ledger
CREATE TABLE IF NOT EXISTS report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (report_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_report_shares_user_id ON report_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_report_shares_share_token ON report_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_share_token ON analysis_reports(share_token);

-- RLS
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

-- Owner can read/insert their own shares
CREATE POLICY "Users can read own shares"
  ON report_shares FOR SELECT
  USING (auth.uid() IN (SELECT auth_id FROM users WHERE id = report_shares.user_id));

CREATE POLICY "Users can create own shares"
  ON report_shares FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT auth_id FROM users WHERE id = report_shares.user_id));

-- Public can read by share_token (for the public preview page, via service role or anon)
CREATE POLICY "Public can read shares by token"
  ON report_shares FOR SELECT
  USING (true);
