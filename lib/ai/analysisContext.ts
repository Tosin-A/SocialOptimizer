import type { AnalysisReport } from "@/types";

export function buildAnalysisContext(report: AnalysisReport): string {
  const sections: string[] = [];

  sections.push(`## Overview
- **Growth Score:** ${report.growth_score}/100
- **Niche:** ${report.detected_niche} (${(report.niche_confidence * 100).toFixed(0)}% confidence)
- **Summary:** ${report.executive_summary}`);

  sections.push(`## Scores
- Content Quality: ${report.content_quality_score}/100
- Hook Strength: ${report.hook_strength_score}/100
- CTA: ${report.cta_score}/100
- Hashtags: ${report.hashtag_score}/100
- Engagement: ${report.engagement_score}/100
- Consistency: ${report.consistency_score}/100
- Branding: ${report.branding_score}/100`);

  sections.push(`## Key Metrics
- Engagement Rate: ${(report.avg_engagement_rate * 100).toFixed(2)}%
- Posts/Week: ${report.avg_posts_per_week}
- Best Days: ${report.best_days.join(", ")}
- Top Formats: ${report.top_performing_formats.join(", ")}
- CTA Usage: ${(report.cta_usage_rate * 100).toFixed(0)}%
- Avg Hook Score: ${(report.avg_hook_score * 100).toFixed(0)}/100`);

  if (report.fix_list.length > 0) {
    const lines = report.fix_list.map((f) => `${f.rank}. ${f.problem} → ${f.action}`);
    sections.push(`## Fix List\n${lines.join("\n")}`);
  }

  return sections.join("\n\n");
}
