import Anthropic from "@anthropic-ai/sdk";
import type {
  AnalysisReport,
  GenerateRequest,
  GeneratedContentOutput,
  Insight,
  RoadmapAction,
  ContentTheme,
  HashtagAnalysis,
  Platform,
  FixListItem,
  PlatformSignalWeight,
  PersonalizedIdea,
  ScoredHook,
  StructuredCaption,
  ReplicateWinnerOutput,
} from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Model tiers ───────────────────────────────────────────────────────────────
// ANALYSIS_MODEL  — core product output (strengths/weaknesses/roadmap). Keep Opus.
// STRATEGY_MODEL  — creative generation + complex structured tasks. Sonnet is sufficient.
// CLASSIFY_MODEL  — classification, scoring, lookup tasks. Haiku handles these well.

const ANALYSIS_MODEL = "claude-opus-4-6";
const STRATEGY_MODEL = "claude-sonnet-4-6";
const CLASSIFY_MODEL = "claude-haiku-4-5-20251001";

const MAX_TOKENS = 8096;

// ─── System prompts ────────────────────────────────────────────────────────────

const ANALYSIS_SYSTEM_PROMPT = `You are an elite social media growth strategist and data analyst with deep expertise in:
- TikTok algorithm mechanics, viral content patterns, and the For You Page (FYP) optimization
- Instagram Reels ranking signals, Explore page optimization, and engagement psychology
- YouTube's watch-time algorithm, thumbnail CTR, and retention optimization
- Facebook's content distribution algorithm and engagement mechanics
- Short-form content psychology: pattern interrupts, open loops, hooks, CTAs
- Hashtag strategy, niche positioning, and audience targeting
- Competitor analysis and market gap identification

You provide data-driven, specific, actionable insights. Never give generic advice.
Always reference specific metrics when making recommendations.
Your output must be structured valid JSON that exactly matches the requested schema.`;

const GENERATION_SYSTEM_PROMPT = `You are a viral content creator and copywriter who has helped hundreds of creators grow from 0 to 100K+ followers.
You understand the psychology of attention, social proof, curiosity gaps, and emotional triggers.
You create platform-native content that feels organic, not corporate.
Your output must be structured valid JSON.`;

// ─── Core analysis functions ──────────────────────────────────────────────────

export async function analyzeNicheAndThemes(posts: {
  caption: string | null;
  hashtags: string[];
  engagement_rate: number | null;
  content_type: string;
}[]): Promise<{
  niche: string;
  confidence: number;
  keywords: string[];
  themes: ContentTheme[];
}> {
  // 20 posts is sufficient for niche classification — reduces input tokens by ~60%
  const postSummary = posts.slice(0, 20).map((p) => ({
    caption: p.caption?.slice(0, 300) ?? "",
    hashtags: p.hashtags.slice(0, 10),
    engagement_rate: p.engagement_rate ?? 0,
    type: p.content_type,
  }));

  const response = await client.messages.create({
    model: CLASSIFY_MODEL,
    max_tokens: MAX_TOKENS,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze these ${postSummary.length} posts and identify the creator's niche and content themes.

Posts data:
${JSON.stringify(postSummary, null, 2)}

Return a JSON object with this exact structure:
{
  "niche": "specific niche name (e.g. 'fitness for beginners', 'personal finance tips', 'travel vlogging')",
  "confidence": 0.0-1.0,
  "keywords": ["keyword1", "keyword2", ...up to 15 keywords],
  "themes": [
    {
      "theme": "theme name",
      "frequency": number_of_posts,
      "avg_engagement_rate": 0.0,
      "is_dominant": true/false
    }
  ]
}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseJSONResponse(text, "analyzeNicheAndThemes");
}

export async function analyzeHashtags(
  hashtags: string[],
  niche: string,
  platform: Platform
): Promise<HashtagAnalysis[]> {
  // Deduplicate and get top 20 most used (20 is sufficient for useful recommendations)
  const tagFrequency = hashtags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([tag, freq]) => ({ tag, frequency: freq }));

  const response = await client.messages.create({
    model: CLASSIFY_MODEL,
    max_tokens: MAX_TOKENS,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze these hashtags for a ${niche} creator on ${platform}.

Hashtag usage frequency:
${JSON.stringify(topTags, null, 2)}

Evaluate each hashtag and return a JSON array:
[
  {
    "tag": "#hashtag",
    "reach_score": 0-100,
    "competition": "low" | "medium" | "high",
    "relevance": 0.0-1.0,
    "recommendation": "keep" | "replace" | "add",
    "suggested_alternative": "alternative hashtag if replacing, or null"
  }
]

Consider:
- Are they too broad (millions of posts = hard to get discovered)?
- Are they too niche (too small to drive meaningful reach)?
- Are they relevant to the detected niche?
- Do they follow the 30/30/30/10 rule (large/medium/small/brand)?`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseJSONResponse(text, "analyzeHashtags");
}

export async function generateInsightsAndRoadmap(analysisData: {
  platform: Platform;
  niche: string;
  avg_engagement_rate: number;
  avg_hook_score: number;
  cta_usage_rate: number;
  posting_consistency: number;
  hashtag_score: number;
  branding_score: number;
  content_themes: ContentTheme[];
  top_performing_formats: string[];
  best_days: string[];
  best_hours: number[];
  avg_posts_per_week: number;
}): Promise<{
  strengths: Insight[];
  weaknesses: Insight[];
  opportunities: Insight[];
  roadmap: RoadmapAction[];
  executive_summary: string;
}> {
  const response = await client.messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: MAX_TOKENS,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate a comprehensive growth strategy analysis for this ${analysisData.platform} creator in the ${analysisData.niche} niche.

Metrics:
- Avg engagement rate: ${(analysisData.avg_engagement_rate * 100).toFixed(2)}%
- Hook strength score: ${(analysisData.avg_hook_score * 100).toFixed(0)}/100
- CTA usage rate: ${(analysisData.cta_usage_rate * 100).toFixed(0)}% of posts
- Posting consistency: ${(analysisData.posting_consistency * 100).toFixed(0)}/100
- Hashtag effectiveness: ${analysisData.hashtag_score}/100
- Branding consistency: ${analysisData.branding_score}/100
- Posts per week: ${analysisData.avg_posts_per_week}
- Best posting days: ${analysisData.best_days.join(", ")}
- Best hours (UTC): ${analysisData.best_hours.join(", ")}
- Top performing formats: ${analysisData.top_performing_formats.join(", ")}
- Content themes: ${analysisData.content_themes.map((t) => t.theme).join(", ")}

Be terse. Each description should be 1-2 sentences max. No filler.

Return this exact JSON structure:
{
  "strengths": [
    {
      "title": "specific strength title",
      "description": "1-2 sentence explanation referencing a specific metric",
      "impact": "high" | "medium" | "low",
      "metric": "specific metric backing this up"
    }
  ],
  "weaknesses": [
    {
      "title": "specific weakness",
      "description": "1-2 sentence explanation of why this hurts growth",
      "impact": "high" | "medium" | "low",
      "metric": "specific metric",
      "recommendation": "specific fix with expected outcome"
    }
  ],
  "opportunities": [
    {
      "title": "growth opportunity",
      "description": "how to capitalize on this",
      "impact": "high" | "medium" | "low"
    }
  ],
  "roadmap": [
    {
      "priority": 1,
      "action": "specific action to take",
      "expected_impact": "quantified expected improvement",
      "timeframe": "e.g. '2 weeks'",
      "category": "content" | "hashtags" | "posting" | "engagement" | "branding"
    }
  ],
  "executive_summary": "1-2 sentence summary of current state and biggest opportunity"
}

Provide 2-3 strengths (high/medium impact only), 2-3 weaknesses (high/medium impact only), 1-2 opportunities (most impactful only), and 4-5 prioritized roadmap actions.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseJSONResponse(text, "generateInsightsAndRoadmap");
}

export async function analyzeHookStrength(transcript: string, caption: string): Promise<{
  score: number;
  hook_text: string;
  hook_type: string;
  feedback: string;
}> {
  const openingWords = transcript ? transcript.slice(0, 300) : caption?.slice(0, 200) ?? "";

  const response = await client.messages.create({
    model: CLASSIFY_MODEL,
    max_tokens: 512,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze this content hook (first 3-5 seconds / opening words):

"${openingWords}"

Rate and analyze the hook. Return JSON:
{
  "score": 0.0-1.0,
  "hook_text": "the actual hook text extracted",
  "hook_type": "question" | "statement" | "stat" | "story" | "controversial" | "none",
  "feedback": "specific feedback on why this hook works or doesn't, with improvement suggestion"
}

Hook scoring rubric:
- 0.9-1.0: Immediately creates curiosity or emotional investment, pattern interrupt
- 0.7-0.9: Good hook with clear value proposition
- 0.5-0.7: Average hook, somewhat engaging
- 0.3-0.5: Weak hook, too slow or generic
- 0.0-0.3: No hook, starts with generic intro`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseJSONResponse(text, "analyzeHookStrength");
}

// ─── Discover module AI functions ─────────────────────────────────────────────

export async function detectOutlierPatterns(
  outliers: Array<{ caption: string | null; engagement_rate: number; multiplier: number; content_type: string }>,
  avgEngagement: number,
  niche: string,
  platform: Platform
): Promise<Array<{ pattern_tags: string[]; what_worked: string }>> {
  const response = await client.messages.create({
    model: STRATEGY_MODEL,
    max_tokens: MAX_TOKENS,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze these outlier posts (${multiplierLabel(outliers)} avg engagement) for a ${niche} creator on ${platform}.

Average engagement rate: ${(avgEngagement * 100).toFixed(2)}%

Outlier posts:
${JSON.stringify(outliers.slice(0, 10).map((o) => ({
  caption_preview: o.caption?.slice(0, 200),
  engagement_multiplier: `${o.multiplier}x`,
  type: o.content_type,
})), null, 2)}

For each post, return JSON array:
[
  {
    "pattern_tags": ["tag1", "tag2"],
    "what_worked": "specific explanation of why this post overperformed"
  }
]

Pattern tags should be reusable categories like "question-hook", "controversial-take", "personal-story", "trend-riding", "specific-number", "before-after", etc.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseJSONResponse(text, "generateFixList");
}

function multiplierLabel(outliers: Array<{ multiplier: number }>): string {
  const min = Math.min(...outliers.map((o) => o.multiplier));
  const max = Math.max(...outliers.map((o) => o.multiplier));
  return `${min}–${max}x`;
}

// ─── Niche saturation — static lookup (no Claude call) ────────────────────────
// Claude's training data is not real-time market data. A static table is more
// honest, faster, and free. Fuzzy-match on niche keywords; fall back to defaults.

interface SaturationEntry {
  active_creators: number;
  avg_engagement_rate: number;
  trend_direction: "growing" | "stable" | "declining";
}

const NICHE_SATURATION_TABLE: Record<string, SaturationEntry> = {
  fitness: { active_creators: 2800000, avg_engagement_rate: 0.042, trend_direction: "stable" },
  gym: { active_creators: 1900000, avg_engagement_rate: 0.039, trend_direction: "stable" },
  workout: { active_creators: 1600000, avg_engagement_rate: 0.041, trend_direction: "stable" },
  "weight loss": { active_creators: 950000, avg_engagement_rate: 0.044, trend_direction: "growing" },
  "personal finance": { active_creators: 980000, avg_engagement_rate: 0.038, trend_direction: "growing" },
  investing: { active_creators: 720000, avg_engagement_rate: 0.035, trend_direction: "growing" },
  "stock market": { active_creators: 540000, avg_engagement_rate: 0.033, trend_direction: "stable" },
  crypto: { active_creators: 1100000, avg_engagement_rate: 0.028, trend_direction: "declining" },
  cooking: { active_creators: 3200000, avg_engagement_rate: 0.051, trend_direction: "stable" },
  recipe: { active_creators: 2100000, avg_engagement_rate: 0.048, trend_direction: "stable" },
  "meal prep": { active_creators: 480000, avg_engagement_rate: 0.055, trend_direction: "growing" },
  travel: { active_creators: 4100000, avg_engagement_rate: 0.036, trend_direction: "stable" },
  vlog: { active_creators: 2900000, avg_engagement_rate: 0.032, trend_direction: "stable" },
  beauty: { active_creators: 3800000, avg_engagement_rate: 0.047, trend_direction: "stable" },
  skincare: { active_creators: 1700000, avg_engagement_rate: 0.052, trend_direction: "growing" },
  makeup: { active_creators: 2600000, avg_engagement_rate: 0.044, trend_direction: "stable" },
  fashion: { active_creators: 4500000, avg_engagement_rate: 0.038, trend_direction: "stable" },
  gaming: { active_creators: 5200000, avg_engagement_rate: 0.029, trend_direction: "stable" },
  tech: { active_creators: 1400000, avg_engagement_rate: 0.034, trend_direction: "growing" },
  business: { active_creators: 1200000, avg_engagement_rate: 0.036, trend_direction: "growing" },
  motivation: { active_creators: 2300000, avg_engagement_rate: 0.031, trend_direction: "declining" },
  mindset: { active_creators: 890000, avg_engagement_rate: 0.033, trend_direction: "stable" },
  education: { active_creators: 1800000, avg_engagement_rate: 0.043, trend_direction: "growing" },
  parenting: { active_creators: 1500000, avg_engagement_rate: 0.049, trend_direction: "stable" },
  pets: { active_creators: 2700000, avg_engagement_rate: 0.057, trend_direction: "stable" },
  music: { active_creators: 3600000, avg_engagement_rate: 0.041, trend_direction: "stable" },
  comedy: { active_creators: 4800000, avg_engagement_rate: 0.044, trend_direction: "stable" },
  dance: { active_creators: 3900000, avg_engagement_rate: 0.053, trend_direction: "stable" },
  diy: { active_creators: 1300000, avg_engagement_rate: 0.048, trend_direction: "growing" },
  art: { active_creators: 2100000, avg_engagement_rate: 0.046, trend_direction: "stable" },
};

const SATURATION_DEFAULT: SaturationEntry = {
  active_creators: 500000,
  avg_engagement_rate: 0.040,
  trend_direction: "stable",
};

function buildSaturationVerdict(
  niche: string,
  entry: SaturationEntry
): string {
  const engPct = (entry.avg_engagement_rate * 100).toFixed(1);
  const creatorLabel =
    entry.active_creators >= 1000000
      ? `${(entry.active_creators / 1000000).toFixed(1)}M`
      : `${Math.round(entry.active_creators / 1000)}K`;

  const trendPhrase =
    entry.trend_direction === "growing"
      ? "audience interest is actively growing"
      : entry.trend_direction === "declining"
      ? "audience interest is contracting — differentiation is critical"
      : "audience interest is holding steady";

  const saturationLevel =
    entry.active_creators >= 3000000
      ? "highly competitive"
      : entry.active_creators >= 1000000
      ? "moderately competitive"
      : "relatively uncrowded";

  return `The ${niche} niche has an estimated ${creatorLabel} active creators — ${saturationLevel} — with an average engagement rate of ${engPct}%. ${trendPhrase.charAt(0).toUpperCase() + trendPhrase.slice(1)}. Creators who establish a specific sub-niche angle will outperform broad competitors.`;
}

export function analyzeNicheSaturation(
  niche: string,
  _platform: Platform,
  benchmarkData?: { avg_engagement_rate?: number; creator_count?: number }
): {
  active_creators: number;
  avg_engagement_rate: number;
  trend_direction: "growing" | "stable" | "declining";
  verdict: string;
} {
  const normalized = niche.toLowerCase().trim();

  // Direct match
  let entry = NICHE_SATURATION_TABLE[normalized];

  // Fuzzy: find first table key that appears in the niche string or vice versa
  if (!entry) {
    const key = Object.keys(NICHE_SATURATION_TABLE).find(
      (k) => normalized.includes(k) || k.includes(normalized)
    );
    entry = key ? NICHE_SATURATION_TABLE[key] : SATURATION_DEFAULT;
  }

  // Override with caller-supplied benchmark data if provided
  const result: SaturationEntry = {
    active_creators: benchmarkData?.creator_count ?? entry.active_creators,
    avg_engagement_rate: benchmarkData?.avg_engagement_rate ?? entry.avg_engagement_rate,
    trend_direction: entry.trend_direction,
  };

  return {
    ...result,
    verdict: buildSaturationVerdict(niche, result),
  };
}

export async function extractFormatPatterns(
  posts: Array<{ content_type: string; engagement_rate: number | null; caption: string | null }>,
  niche: string,
  platform: Platform
): Promise<Array<{
  format: string;
  count: number;
  avg_engagement_rate: number;
  pct_of_total: number;
  recommendation: string;
}>> {
  // Compute format stats
  const formatMap: Record<string, { count: number; totalEng: number }> = {};
  for (const post of posts) {
    const fmt = post.content_type;
    if (!formatMap[fmt]) formatMap[fmt] = { count: 0, totalEng: 0 };
    formatMap[fmt].count++;
    formatMap[fmt].totalEng += post.engagement_rate ?? 0;
  }

  const total = posts.length;
  const stats = Object.entries(formatMap).map(([format, data]) => ({
    format,
    count: data.count,
    avg_engagement_rate: data.count > 0 ? data.totalEng / data.count : 0,
    pct_of_total: total > 0 ? data.count / total : 0,
  }));

  const response = await client.messages.create({
    model: CLASSIFY_MODEL,
    max_tokens: MAX_TOKENS,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze this content format distribution for a ${niche} creator on ${platform}.

Format stats:
${JSON.stringify(stats, null, 2)}

For each format, add a specific "recommendation" field explaining what to do (increase, decrease, or maintain this format and why).

Return JSON array:
${JSON.stringify(stats.map((s) => ({ ...s, recommendation: "specific recommendation" })), null, 2)}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseJSONResponse(text, "generateContent");
}

// ─── Ranked fix list ──────────────────────────────────────────────────────────

export async function generateFixList(analysisData: {
  platform: Platform;
  niche: string;
  growth_score: number;
  hook_strength_score: number;
  cta_score: number;
  hashtag_score: number;
  engagement_score: number;
  consistency_score: number;
  branding_score: number;
  avg_engagement_rate: number;
  avg_hook_score: number;
  cta_usage_rate: number;
  avg_posts_per_week: number;
  platform_signal_weights: PlatformSignalWeight[];
}): Promise<FixListItem[]> {
  const signalSummary = analysisData.platform_signal_weights
    .map((sw) => `${sw.signal}: ${sw.current_score}/100 (benchmark: ${sw.benchmark}, weight: ${sw.weight})`)
    .join("\n");

  const response = await client.messages.create({
    model: STRATEGY_MODEL,
    max_tokens: MAX_TOKENS,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate a ranked fix list (max 4 items) for this ${analysisData.platform} creator in the ${analysisData.niche} niche.

Current scores:
- Growth score: ${analysisData.growth_score}/100
- Hook strength: ${analysisData.hook_strength_score}/100
- CTA usage: ${analysisData.cta_score}/100
- Hashtag effectiveness: ${analysisData.hashtag_score}/100
- Engagement: ${analysisData.engagement_score}/100
- Consistency: ${analysisData.consistency_score}/100
- Branding: ${analysisData.branding_score}/100
- Avg engagement rate: ${(analysisData.avg_engagement_rate * 100).toFixed(2)}%
- Avg hook score: ${(analysisData.avg_hook_score * 100).toFixed(0)}/100
- CTA usage rate: ${(analysisData.cta_usage_rate * 100).toFixed(0)}%
- Posts per week: ${analysisData.avg_posts_per_week}

Platform signal weights:
${signalSummary}

Be terse. Each field should be 1-2 sentences max. No filler.

Return a JSON array of max 4 items, ranked by expected impact (highest first):
[
  {
    "rank": 1,
    "problem": "specific problem statement referencing a metric",
    "why_it_matters": "concise explanation of why this hurts growth on ${analysisData.platform}",
    "action": "specific, concrete action to take (not 'improve hooks' but 'rewrite first sentence to open with a question or surprising stat')",
    "impact": "high" | "medium" | "low",
    "metric_reference": "the specific metric backing this (e.g. 'hook score 23/100 vs benchmark 55')"
  }
]

Rules:
- Every item must reference a specific score or metric
- Actions must be concrete enough to execute today
- Rank by which fix will move the growth score the most (weight × gap from benchmark)
- No motivational filler. No hedging language.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseJSONResponse(text, "generatePersonalizedIdeas");
}

// ─── Content generation ───────────────────────────────────────────────────────

export async function generatePersonalizedIdeas(
  context: {
    outlierPatterns: string[];
    trendNames: string[];
    niche: string;
    platform: Platform;
    topThemes: string[];
  }
): Promise<PersonalizedIdea[]> {
  const response = await client.messages.create({
    model: STRATEGY_MODEL,
    max_tokens: MAX_TOKENS,
    system: GENERATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate 10 personalized content ideas for a ${context.niche} creator on ${context.platform}.

Context:
- Outlier patterns that worked: ${context.outlierPatterns.join(", ") || "none detected"}
- Current trends: ${context.trendNames.join(", ") || "none available"}
- Top content themes: ${context.topThemes.join(", ")}

Each idea should be directly inspired by either an outlier pattern, a current trend, or a gap in their niche coverage.

Return JSON array:
[
  {
    "title": "specific video/post title",
    "angle": "unique perspective or hook angle",
    "source": "outlier" | "trend" | "niche_gap",
    "source_reference": "which specific pattern/trend inspired this",
    "why_it_works": "psychological or algorithmic reason",
    "format": "video" | "reel" | "short" | "post" | "story",
    "estimated_engagement": "high" | "medium" | "low"
  }
]`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseJSONResponse(text, "scoreHooks");
}

export async function generateScoredHooks(
  topic: string,
  niche: string,
  platform: Platform
): Promise<ScoredHook[]> {
  const response = await client.messages.create({
    model: STRATEGY_MODEL,
    max_tokens: MAX_TOKENS,
    system: GENERATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate 10 hooks for a ${platform} post about "${topic}" in the ${niche} niche.

Score each hook on:
1. Overall score (0-100) — how likely this hook grabs attention
2. Pattern interrupt score (0-100) — how much it breaks the scroll pattern

Mark the top 2 hooks as "ab_recommended: true" for A/B testing.

Return JSON array:
[
  {
    "text": "the hook text",
    "score": 0-100,
    "type": "question" | "statement" | "stat" | "story" | "controversial",
    "pattern_interrupt_score": 0-100,
    "ab_recommended": true/false,
    "psychology": "why this hook works"
  }
]

Sort by score descending.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseJSONResponse(text, "buildStructuredCaption");
}

export async function generateStructuredCaption(
  topic: string,
  niche: string,
  platform: Platform
): Promise<StructuredCaption> {
  const response = await client.messages.create({
    model: STRATEGY_MODEL,
    max_tokens: MAX_TOKENS,
    system: GENERATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate a structured 3-part caption for a ${platform} post about "${topic}" in the ${niche} niche.

The caption must have exactly 3 sections:
1. Hook — the opening line that stops the scroll
2. Body — the value/story/insight
3. CTA — the specific ask

Score each section individually and provide feedback.

Return JSON:
{
  "sections": [
    { "label": "hook", "text": "...", "score": 0-100, "feedback": "why this works or how to improve" },
    { "label": "body", "text": "...", "score": 0-100, "feedback": "..." },
    { "label": "cta", "text": "...", "score": 0-100, "feedback": "..." }
  ],
  "overall_score": 0-100,
  "hashtags": ["#tag1", "#tag2", ...up to 15 relevant hashtags],
  "character_count": total_characters
}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseJSONResponse(text, "generatePostingTimeRecommendations");
}

export async function generateContent(
  request: GenerateRequest,
  userContext?: { niche: string; top_themes: string[]; avg_engagement: number; brand_pillars?: string[] }
): Promise<GeneratedContentOutput> {
  const pillarsStr = userContext?.brand_pillars?.length
    ? `\nCreator's brand pillars: [${userContext.brand_pillars.join(", ")}]. Align generated content with these pillars.`
    : "";
  const contextStr = userContext
    ? `Account context: Niche=${userContext.niche}, Top themes=${userContext.top_themes.join(", ")}, Avg engagement=${(userContext.avg_engagement * 100).toFixed(2)}%${pillarsStr}`
    : "";

  const platformSpecifics: Record<string, string> = {
    tiktok: "TikTok FYP algorithm favors: strong hooks in first 1-2s, high completion rate, native sounds, trending audio, text overlays, captions. Videos 15-60s perform best.",
    instagram: "Instagram Reels: original audio preferred, cover image matters for saves, use carousel for educational content, hashtags in first comment, location tags boost reach.",
    youtube: "YouTube Shorts: loop-friendly content performs well. For long-form: strong thumbnail + title CTR, first 30s must deliver on the title promise, chapters for retention.",
    facebook: "Facebook: emotional content shares more, text posts still get reach, video must caption-readable without sound, peak hours 1-4pm and 7-9pm.",
  };

  const response = await client.messages.create({
    model: STRATEGY_MODEL,
    max_tokens: MAX_TOKENS,
    system: GENERATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate ${request.content_type} content for a ${request.platform} creator.

Topic: ${request.topic}
Niche: ${request.niche}
Tone: ${request.tone ?? "entertaining and educational"}
Target audience: ${request.target_audience ?? "general audience interested in " + request.niche}
Count: ${request.count ?? 5} variations
${contextStr}

Platform specifics: ${platformSpecifics[request.platform]}

${getGenerationSchema(request.content_type)}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseJSONResponse(text, "discoverWinningFormats");
}

function getGenerationSchema(type: string): string {
  switch (type) {
    case "hook":
      return `Return JSON: { "hooks": [{ "text": "hook text", "type": "question|statement|stat|story|controversial", "psychology": "why this works psychologically", "expected_retention": "high|medium|low" }] }`;
    case "caption":
      return `Return JSON: { "captions": [{ "caption": "full caption text", "hashtags": ["tag1","tag2",...30 tags], "cta": "call to action", "character_count": 0 }] }`;
    case "script":
      return `Return JSON: { "scripts": [{ "hook": "opening hook (0-3s)", "hook_duration": "3s", "body_points": [{"timestamp": "3-15s", "content": "point content"}], "cta": "closing CTA", "total_duration": "45s" }] }`;
    case "idea":
      return `Return JSON: { "video_ideas": [{ "title": "video title", "angle": "unique angle/POV", "why_it_works": "psychology behind this idea", "format": "video|reel|short|post" }] }`;
    case "hashtags":
      return `Return JSON: { "hashtag_sets": [{ "name": "set name", "tags": ["#tag1",...30 tags], "strategy": "explanation of the hashtag strategy mix" }] }`;
    case "full_plan":
      return `Return JSON with ALL keys: { "hooks": [...5 hooks using the hook schema above], "captions": [...3 captions using the caption schema above], "scripts": [...2 scripts using the script schema above], "hashtag_sets": [...2 sets using the hashtag_sets schema above], "video_ideas": [...5 ideas using the video_ideas schema above] }`;
    default:
      return `Return appropriate JSON for the content type.`;
  }
}

// ─── Replicate Winners ────────────────────────────────────────────────────────

export async function generateReplicateWinners(
  niche: string,
  platform: Platform,
  count: number = 3,
  competitorContext?: Array<{ username: string; followers: number | null; avg_engagement_rate: number | null; top_hashtags: string[]; content_formats: string[] }>
): Promise<ReplicateWinnerOutput[]> {
  const competitorSection = competitorContext && competitorContext.length > 0
    ? `\nKnown competitors in this niche:\n${JSON.stringify(competitorContext.map((c) => ({
        username: c.username,
        followers: c.followers,
        avg_engagement: c.avg_engagement_rate ? `${(c.avg_engagement_rate * 100).toFixed(2)}%` : "unknown",
        top_hashtags: c.top_hashtags.slice(0, 5),
        formats: c.content_formats,
      })), null, 2)}\nUse these competitor profiles to inform what winning patterns look like in this niche.`
    : "";

  const response = await client.messages.create({
    model: STRATEGY_MODEL,
    max_tokens: MAX_TOKENS,
    system: GENERATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Identify ${count} specific winning post patterns that top creators use in the ${niche} niche on ${platform}. For each pattern, describe a real example of how it's used by successful creators, then create a new post concept the user can replicate with their own angle.
${competitorSection}
Return exactly ${count} items as a JSON array:
[
  {
    "original_post": {
      "caption_preview": "example of a winning post in this niche (realistic caption snippet)",
      "engagement_rate": "estimated typical engagement rate for this pattern",
      "why_it_worked": "1-2 sentence analysis of the winning pattern"
    },
    "replicated_content": {
      "hook": "opening hook line (first 1-3 seconds)",
      "caption": "full caption text",
      "script_outline": "brief 3-5 bullet point script outline",
      "hashtags": ["#tag1", "#tag2", ...up to 15],
      "format": "video" | "reel" | "short" | "post",
      "expected_engagement": "high" | "medium" | "low"
    },
    "adaptation_notes": "1 sentence on how this was adapted for a fresh angle in the ${niche} niche"
  }
]

Rules:
- Each winning pattern must be a distinct, proven content format (e.g. "controversial take", "before/after transformation", "day-in-the-life", "myth-busting", "POV storytelling")
- The original_post should describe a realistic winning post other creators use — not generic
- The replicated_content must be specific and filmable today
- No filler. No generic advice.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseJSONResponse(text, "replicateWinner");
}

// ─── Content Coach chat ───────────────────────────────────────────────────

const COACH_SYSTEM_PROMPT = `You are a content coach inside SocialOptimizer — a data-driven social media analysis tool.

You operate in two modes depending on what data is available:

**When analysis data is provided:**
- Answer questions about the user's page performance, strategy, and growth using the data.
- Reference specific metrics and numbers from the data when answering.
- If the data doesn't contain enough information to answer, say so explicitly. Do not fabricate numbers.

**When no analysis data is available:**
- Answer general social media strategy, marketing, and content creation questions using your knowledge.
- You can and should use web search to find real examples, case studies, and current best practices.
- When citing examples from the web, mention the source.

**Always:**
- Be direct and terse. No motivational filler, no "great question!" preamble.
- Give concrete, actionable advice — not vague encouragement.
- When the user asks about strategies or tactics, search for real-world examples that worked.
- Format your response in markdown for readability. Use bold for metrics, bullet points for lists.
- Keep responses under 400 words unless the question warrants more detail.`;

export async function coachChat(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  analysisContext?: string
): Promise<string> {
  const apiMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

  if (analysisContext) {
    apiMessages.push(
      { role: "user", content: `Here is the user's current analysis data:\n\n${analysisContext}\n\nAnswer their questions using this data.` },
      { role: "assistant", content: "Understood. I have your analysis data loaded. What would you like to know?" }
    );
  } else {
    apiMessages.push(
      { role: "user", content: "I don't have an analysis report yet. I'd like to ask some general questions about social media strategy and growth." },
      { role: "assistant", content: "No problem. I can help with general social media strategy, content creation, and marketing questions. I'll search for real examples and current best practices when relevant. What would you like to know?" }
    );
  }

  apiMessages.push(
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))
  );

  // Keep web search enabled while remaining compatible across Anthropic SDK type revisions.
  const coachTools = [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }] as unknown as
    Parameters<typeof client.messages.create>[0]["tools"];

  const response = await client.messages.create({
    model: STRATEGY_MODEL,
    max_tokens: MAX_TOKENS,
    system: COACH_SYSTEM_PROMPT,
    messages: apiMessages,
    tools: coachTools,
  });

  // Extract text from response, which may include tool use blocks from web search
  const textBlocks = response.content.filter((block) => block.type === "text");
  return textBlocks.map((block) => block.text).join("\n\n");
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function extractJSON(text: string): string {
  // Try to extract JSON from markdown code blocks
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) return codeBlock[1];

  // Find raw JSON object/array
  const jsonStart = text.search(/[\[{]/);
  if (jsonStart !== -1) return text.slice(jsonStart);

  return text;
}

async function parseJSONResponse<T>(text: string, context: string): Promise<T> {
  const extracted = extractJSON(text);

  try {
    return JSON.parse(extracted) as T;
  } catch (initialError) {
    const repairResponse = await client.messages.create({
      model: CLASSIFY_MODEL,
      max_tokens: 2048,
      system:
        "You are a strict JSON repair utility. Fix invalid JSON and return only valid JSON. Do not include markdown, commentary, or code fences.",
      messages: [
        {
          role: "user",
          content: `Repair this JSON so it parses correctly. Keep the same keys and values as much as possible.\n\nContext: ${context}\n\nInvalid JSON:\n${extracted}`,
        },
      ],
    });

    const repairedText = repairResponse.content[0]?.type === "text" ? repairResponse.content[0].text : "";
    const repaired = extractJSON(repairedText);

    try {
      return JSON.parse(repaired) as T;
    } catch (repairError) {
      const initialMessage = initialError instanceof Error ? initialError.message : String(initialError);
      const repairMessage = repairError instanceof Error ? repairError.message : String(repairError);
      throw new Error(
        `Failed to parse JSON for ${context}. Initial parse error: ${initialMessage}. Repair parse error: ${repairMessage}.`
      );
    }
  }
}
