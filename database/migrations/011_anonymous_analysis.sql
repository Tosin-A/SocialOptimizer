-- ════════════════════════════════════════════════════════════════════════════
-- Migration 011: Anonymous analysis support
-- Allows unauthenticated users to run analyses before signing up
-- ════════════════════════════════════════════════════════════════════════════

-- analysis_jobs: make user_id nullable, add anonymous tracking fields
ALTER TABLE analysis_jobs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE analysis_jobs ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS anonymous_id TEXT;
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS tiktok_username TEXT;
ALTER TABLE analysis_jobs ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_jobs_anonymous_id ON analysis_jobs(anonymous_id) WHERE anonymous_id IS NOT NULL;

-- analysis_reports: make user_id and account_id nullable for anonymous reports
ALTER TABLE analysis_reports ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE analysis_reports ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS anonymous_id TEXT;
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS tiktok_username TEXT;

CREATE INDEX IF NOT EXISTS idx_reports_anonymous_id ON analysis_reports(anonymous_id) WHERE anonymous_id IS NOT NULL;

-- RLS: allow anonymous reads by job_id (service role handles writes)
CREATE POLICY "jobs_anonymous_read" ON analysis_jobs
  FOR SELECT USING (is_anonymous = TRUE);

CREATE POLICY "reports_anonymous_read" ON analysis_reports
  FOR SELECT USING (anonymous_id IS NOT NULL);
