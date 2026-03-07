-- Add fix_list and platform_signal_weights to analysis_reports
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS fix_list JSONB DEFAULT '[]';
ALTER TABLE analysis_reports ADD COLUMN IF NOT EXISTS platform_signal_weights JSONB DEFAULT '[]';
