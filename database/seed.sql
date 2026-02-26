-- Seed niche benchmarks with realistic industry data
INSERT INTO niche_benchmarks (platform, niche, avg_engagement_rate, avg_posts_per_week, median_follower_count, top_content_types, top_hashtags)
VALUES
  -- TikTok benchmarks
  ('tiktok', 'fitness',          0.089, 7.2, 45000,  '{"video","reel"}', '{"#fitness","#workout","#gym","#fitnessmotivation","#health"}'),
  ('tiktok', 'personal finance', 0.072, 5.1, 38000,  '{"video"}',        '{"#money","#personalfinance","#investing","#finance","#moneytips"}'),
  ('tiktok', 'food & cooking',   0.094, 8.3, 52000,  '{"video","reel"}', '{"#food","#recipe","#cooking","#foodtok","#foodie"}'),
  ('tiktok', 'travel',           0.065, 4.5, 62000,  '{"video","reel"}', '{"#travel","#traveltok","#wanderlust","#adventure","#explore"}'),
  ('tiktok', 'beauty',           0.078, 6.8, 71000,  '{"video","reel"}', '{"#beauty","#makeup","#skincare","#beautytok","#glam"}'),
  ('tiktok', 'education',        0.058, 4.2, 29000,  '{"video"}',        '{"#learnontiktok","#education","#studytok","#tips","#howto"}'),

  -- Instagram benchmarks
  ('instagram', 'fitness',          0.042, 4.8, 32000,  '{"reel","post"}',  '{"#fitness","#gym","#workout","#fitlife","#healthylifestyle"}'),
  ('instagram', 'personal finance', 0.038, 3.5, 24000,  '{"post","reel"}',  '{"#personalfinance","#money","#investing","#financialfreedom","#wealthmindset"}'),
  ('instagram', 'food & cooking',   0.051, 5.2, 41000,  '{"post","reel"}',  '{"#food","#foodie","#instafood","#recipe","#foodphotography"}'),
  ('instagram', 'travel',           0.035, 3.2, 55000,  '{"post","reel"}',  '{"#travel","#wanderlust","#travelgram","#adventure","#explore"}'),

  -- YouTube benchmarks
  ('youtube', 'fitness',          0.038, 1.8, 28000,  '{"video","short"}', '{"#fitness","#workout","#gym"}'),
  ('youtube', 'personal finance', 0.045, 1.4, 35000,  '{"video"}',         '{"#money","#investing","#finance"}'),
  ('youtube', 'education',        0.041, 2.1, 22000,  '{"video","short"}', '{"#education","#tutorial","#howto"}'),
  ('youtube', 'gaming',           0.052, 3.5, 48000,  '{"video","short"}', '{"#gaming","#gamer","#gameplay"}')

ON CONFLICT (platform, niche) DO NOTHING;
