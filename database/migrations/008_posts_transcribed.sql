-- Add posts_transcribed column to analysis_reports
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS posts_transcribed INT DEFAULT 0;
