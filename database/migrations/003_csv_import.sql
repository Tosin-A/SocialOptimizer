-- Add is_csv_import flag to connected_accounts
ALTER TABLE connected_accounts ADD COLUMN IF NOT EXISTS is_csv_import BOOLEAN NOT NULL DEFAULT FALSE;
