-- Add email notification preferences to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_analysis_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_weekly_digest          BOOLEAN NOT NULL DEFAULT true;
