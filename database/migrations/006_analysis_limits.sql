-- Update analysis limits per plan: Free 1, Starter 10, Pro 20, Agency 50
UPDATE users SET analyses_limit = 1 WHERE plan = 'free';
UPDATE users SET analyses_limit = 10 WHERE plan = 'starter';
UPDATE users SET analyses_limit = 20 WHERE plan = 'pro';
UPDATE users SET analyses_limit = 50 WHERE plan = 'agency';
