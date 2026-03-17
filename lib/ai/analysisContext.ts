import type { AnalysisReport } from "@/types";

export function buildAnalysisContext(report: AnalysisReport): string {
  const sections: string[] = [];

  sections.push(`## Overview
- **Growth Score:** ${report.growth_score}/100
- **Detected Niche:** ${report.detected_niche} (confidence: ${(report.niche_confidence * 100).toFixed(0)}%)
- **Executive Summary:** ${report.executive_summary}`);

  sections.push(`## Scores
- Content Quality: ${report.content_quality_score}/100
- Hook Strength: ${report.hook_strength_score}/100
- CTA Score: ${report.cta_score}/100
- Hashtag Effectiveness: ${report.hashtag_score}/100
- Engagement Score: ${report.engagement_score}/100
- Consistency Score: ${report.consistency_score}/100
- Branding Score: ${report.branding_score}/100`);

  sections.push(`## Engagement Metrics
- Avg Engagement Rate: ${(report.avg_engagement_rate * 100).toFixed(2)}%
- Avg Likes: ${report.avg_likes}
- Avg Comments: ${report.avg_comments}
- Avg Shares: ${report.avg_shares}
- Avg Views: ${report.avg_views}
- Avg Hook Score: ${(report.avg_hook_score * 100).toFixed(0)}/100
- CTA Usage Rate: ${(report.cta_usage_rate * 100).toFixed(0)}%
- Caption Sentiment: ${report.caption_sentiment}
- Avg Caption Length: ${report.avg_caption_length} chars`);

  sections.push(`## Posting Patterns
- Posts Per Week: ${report.avg_posts_per_week}
- Best Days: ${report.best_days.join(", ")}
- Best Hours (UTC): ${report.best_hours.join(", ")}
- Posting Consistency: ${report.posting_consistency}/100
- Top Performing Formats: ${report.top_performing_formats.join(", ")}`);

  if (report.content_themes.length > 0) {
    const themeLines = report.content_themes.map(
      (t) => `- ${t.theme}: ${t.frequency} posts, ${(t.avg_engagement_rate * 100).toFixed(2)}% avg engagement${t.is_dominant ? " (dominant)" : ""}`
    );
    sections.push(`## Content Themes\n${themeLines.join("\n")}`);
  }

  if (report.strengths.length > 0) {
    const lines = report.strengths.map((s) => `- **${s.title}** (${s.impact}): ${s.description}${s.metric ? ` [${s.metric}]` : ""}`);
    sections.push(`## Strengths\n${lines.join("\n")}`);
  }

  if (report.weaknesses.length > 0) {
    const lines = report.weaknesses.map((w) => `- **${w.title}** (${w.impact}): ${w.description}${w.recommendation ? ` → ${w.recommendation}` : ""}`);
    sections.push(`## Weaknesses\n${lines.join("\n")}`);
  }

  if (report.fix_list.length > 0) {
    const lines = report.fix_list.map((f) => `${f.rank}. **${f.problem}** — ${f.action} [${f.metric_reference}]`);
    sections.push(`## Priority Fix List\n${lines.join("\n")}`);
  }

  if (report.improvement_roadmap.length > 0) {
    const lines = report.improvement_roadmap.map(
      (r) => `${r.priority}. **${r.action}** (${r.category}, ${r.timeframe}) — Expected: ${r.expected_impact}`
    );
    sections.push(`## Improvement Roadmap\n${lines.join("\n")}`);
  }

  if (report.hashtag_effectiveness.length > 0) {
    const topHashtags = report.hashtag_effectiveness.slice(0, 10);
    const lines = topHashtags.map(
      (h) => `- ${h.tag}: reach ${h.reach_score}/100, competition ${h.competition}, relevance ${(h.relevance * 100).toFixed(0)}% → ${h.recommendation}`
    );
    sections.push(`## Top Hashtag Analysis\n${lines.join("\n")}`);
  }

  return sections.join("\n\n");
}
