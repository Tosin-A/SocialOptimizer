// ════════════════════════════════════════════════════════════════════════════
// Outlier detection — pure math, no AI
// ════════════════════════════════════════════════════════════════════════════

import type { Post } from "@/types";

export interface DetectedOutlier {
  post: Post;
  multiplier: number;
  avg_engagement: number;
}

export function findOutliers(
  posts: Post[],
  threshold: number = 3.0
): DetectedOutlier[] {
  if (posts.length < 5) return [];

  const engagementRates = posts
    .map((p) => p.engagement_rate ?? 0)
    .filter((r) => r > 0);

  if (engagementRates.length < 5) return [];

  const avg =
    engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length;

  if (avg === 0) return [];

  const outliers: DetectedOutlier[] = [];

  for (const post of posts) {
    const rate = post.engagement_rate ?? 0;
    if (rate <= 0) continue;

    const multiplier = rate / avg;
    if (multiplier >= threshold) {
      outliers.push({ post, multiplier: parseFloat(multiplier.toFixed(1)), avg_engagement: avg });
    }
  }

  // Sort by multiplier desc
  return outliers.sort((a, b) => b.multiplier - a.multiplier);
}
