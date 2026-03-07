// ════════════════════════════════════════════════════════════════════════════
// Posting time recommendations — pure math from post data
// ════════════════════════════════════════════════════════════════════════════

import type { PostingTimeRecommendation } from "@/types";

interface PostData {
  posted_at: string;
  engagement_rate: number | null;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function calcPostingTimeRecommendations(
  posts: PostData[]
): PostingTimeRecommendation[] {
  if (posts.length < 10) return [];

  // Build a 7×24 grid of average engagement rates
  const grid: Record<string, { total: number; count: number }> = {};

  for (const post of posts) {
    const date = new Date(post.posted_at);
    const day = date.getDay();
    const hour = date.getUTCHours();
    const key = `${day}-${hour}`;

    if (!grid[key]) grid[key] = { total: 0, count: 0 };
    grid[key].total += post.engagement_rate ?? 0;
    grid[key].count += 1;
  }

  // Convert to recommendations, only include cells with data
  const recommendations: PostingTimeRecommendation[] = [];

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`;
      const cell = grid[key];
      if (!cell || cell.count === 0) continue;

      const avg = cell.total / cell.count;
      recommendations.push({
        day: DAY_NAMES[day],
        hour,
        score: 0, // will normalize below
        label: "",
      });
    }
  }

  if (recommendations.length === 0) return [];

  // Normalize scores to 0-100 based on engagement rates
  const allAvgs = recommendations.map((r) => {
    const key = `${DAY_NAMES.indexOf(r.day)}-${r.hour}`;
    const cell = grid[key];
    return cell ? cell.total / cell.count : 0;
  });

  const maxAvg = Math.max(...allAvgs);
  const minAvg = Math.min(...allAvgs);
  const range = maxAvg - minAvg || 1;

  for (let i = 0; i < recommendations.length; i++) {
    const normalized = Math.round(((allAvgs[i] - minAvg) / range) * 100);
    recommendations[i].score = normalized;
    recommendations[i].label = normalized >= 75 ? "Best" : normalized >= 40 ? "Good" : "OK";
  }

  // Sort by score desc, return top slots
  return recommendations.sort((a, b) => b.score - a.score);
}
