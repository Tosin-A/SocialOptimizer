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
} from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-opus-4-6";
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
  const postSummary = posts.slice(0, 50).map((p) => ({
    caption: p.caption?.slice(0, 300) ?? "",
    hashtags: p.hashtags.slice(0, 10),
    engagement_rate: p.engagement_rate ?? 0,
    type: p.content_type,
  }));

  const response = await client.messages.create({
    model: MODEL,
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
  return JSON.parse(extractJSON(text));
}

export async function analyzeHashtags(
  hashtags: string[],
  niche: string,
  platform: Platform
): Promise<HashtagAnalysis[]> {
  // Deduplicate and get top 30 most used
  const tagFrequency = hashtags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([tag, freq]) => ({ tag, frequency: freq }));

  const response = await client.messages.create({
    model: MODEL,
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
  return JSON.parse(extractJSON(text));
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
    model: MODEL,
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

Return this exact JSON structure:
{
  "strengths": [
    {
      "title": "specific strength title",
      "description": "detailed explanation with specific metrics",
      "impact": "high" | "medium" | "low",
      "metric": "specific metric backing this up"
    }
  ],
  "weaknesses": [
    {
      "title": "specific weakness",
      "description": "why this hurts growth with specific context",
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
  "executive_summary": "2-3 sentence executive summary of the creator's current state and biggest opportunity"
}

Provide minimum 3 items in strengths and weaknesses. Roadmap should have 8-10 prioritized actions.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(extractJSON(text));
}

export async function analyzeHookStrength(transcript: string, caption: string): Promise<{
  score: number;
  hook_text: string;
  hook_type: string;
  feedback: string;
}> {
  const openingWords = transcript ? transcript.slice(0, 300) : caption?.slice(0, 200) ?? "";

  const response = await client.messages.create({
    model: MODEL,
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
  return JSON.parse(extractJSON(text));
}

// ─── Competitor analysis AI functions ─────────────────────────────────────────

export async function analyzeHashtagGap(
  userHashtags: string[],
  competitorHashtags: string[],
  niche: string,
  platform: Platform
): Promise<Array<{ hashtag: string; competitor_uses: boolean; user_uses: boolean; recommendation: string; rationale: string }>> {
  const userSet = new Set(userHashtags.map((h) => h.toLowerCase()));
  const compSet = new Set(competitorHashtags.map((h) => h.toLowerCase()));

  // Find gaps
  const compOnly = [...compSet].filter((h) => !userSet.has(h));
  const userOnly = [...userSet].filter((h) => !compSet.has(h));
  const shared = [...userSet].filter((h) => compSet.has(h));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze the hashtag gap between a user and their competitor in the ${niche} niche on ${platform}.

Competitor uses but user doesn't: ${compOnly.slice(0, 20).join(", ")}
User uses but competitor doesn't: ${userOnly.slice(0, 20).join(", ")}
Both use: ${shared.slice(0, 20).join(", ")}

For the top 10 most impactful hashtags, return JSON array:
[
  {
    "hashtag": "#tag",
    "competitor_uses": true/false,
    "user_uses": true/false,
    "recommendation": "adopt" | "ignore" | "already_using",
    "rationale": "specific reason to adopt or ignore this hashtag"
  }
]

Focus on hashtags that would meaningfully improve reach in the ${niche} niche.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(extractJSON(text));
}

export async function analyzeCompetitorOutliers(
  competitorPosts: Array<{ caption: string | null; engagement_rate: number; content_type: string }>,
  avgEngagement: number,
  niche: string,
  platform: Platform
): Promise<Array<{ caption: string | null; engagement_rate: number; multiplier: number; what_worked: string }>> {
  const outliers = competitorPosts
    .filter((p) => p.engagement_rate > avgEngagement * 3)
    .sort((a, b) => b.engagement_rate - a.engagement_rate)
    .slice(0, 5);

  if (outliers.length === 0) return [];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze these competitor outlier posts in the ${niche} niche on ${platform}.
Average competitor engagement: ${(avgEngagement * 100).toFixed(2)}%

Outlier posts:
${JSON.stringify(outliers.map((o) => ({
  caption_preview: o.caption?.slice(0, 200),
  engagement_rate: `${(o.engagement_rate * 100).toFixed(2)}%`,
  multiplier: `${(o.engagement_rate / avgEngagement).toFixed(1)}x`,
  type: o.content_type,
})), null, 2)}

For each post, explain what worked and how the user could apply the same pattern.

Return JSON array:
[
  {
    "caption": "short caption preview",
    "engagement_rate": 0.0,
    "multiplier": 3.5,
    "what_worked": "specific explanation"
  }
]`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(extractJSON(text));
}

// ─── Discover module AI functions ─────────────────────────────────────────────

export async function detectOutlierPatterns(
  outliers: Array<{ caption: string | null; engagement_rate: number; multiplier: number; content_type: string }>,
  avgEngagement: number,
  niche: string,
  platform: Platform
): Promise<Array<{ pattern_tags: string[]; what_worked: string }>> {
  const response = await client.messages.create({
    model: MODEL,
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
  return JSON.parse(extractJSON(text));
}

function multiplierLabel(outliers: Array<{ multiplier: number }>): string {
  const min = Math.min(...outliers.map((o) => o.multiplier));
  const max = Math.max(...outliers.map((o) => o.multiplier));
  return `${min}–${max}x`;
}

export async function analyzeNicheSaturation(
  niche: string,
  platform: Platform,
  benchmarkData?: { avg_engagement_rate?: number; creator_count?: number }
): Promise<{
  active_creators: number;
  avg_engagement_rate: number;
  trend_direction: "growing" | "stable" | "declining";
  verdict: string;
}> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Assess the saturation level of the "${niche}" niche on ${platform}.

${benchmarkData ? `Known data: ~${benchmarkData.creator_count ?? "unknown"} creators, avg engagement ${benchmarkData.avg_engagement_rate ? (benchmarkData.avg_engagement_rate * 100).toFixed(2) + "%" : "unknown"}` : "No benchmark data available — estimate based on your knowledge."}

Return JSON:
{
  "active_creators": estimated_number,
  "avg_engagement_rate": 0.0-1.0,
  "trend_direction": "growing" | "stable" | "declining",
  "verdict": "2-3 sentence assessment: is this niche oversaturated, has opportunity, or is emerging? Be specific about why."
}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(extractJSON(text));
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
    model: MODEL,
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
  return JSON.parse(extractJSON(text));
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
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate a ranked fix list (max 6 items) for this ${analysisData.platform} creator in the ${analysisData.niche} niche.

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

Return a JSON array of max 6 items, ranked by expected impact (highest first):
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
  return JSON.parse(extractJSON(text));
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
    model: MODEL,
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
  return JSON.parse(extractJSON(text));
}

export async function generateScoredHooks(
  topic: string,
  niche: string,
  platform: Platform
): Promise<ScoredHook[]> {
  const response = await client.messages.create({
    model: MODEL,
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
  return JSON.parse(extractJSON(text));
}

export async function generateStructuredCaption(
  topic: string,
  niche: string,
  platform: Platform
): Promise<StructuredCaption> {
  const response = await client.messages.create({
    model: MODEL,
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
  return JSON.parse(extractJSON(text));
}

export async function generateContent(
  request: GenerateRequest,
  userContext?: { niche: string; top_themes: string[]; avg_engagement: number }
): Promise<GeneratedContentOutput> {
  const contextStr = userContext
    ? `Account context: Niche=${userContext.niche}, Top themes=${userContext.top_themes.join(", ")}, Avg engagement=${(userContext.avg_engagement * 100).toFixed(2)}%`
    : "";

  const platformSpecifics: Record<string, string> = {
    tiktok: "TikTok FYP algorithm favors: strong hooks in first 1-2s, high completion rate, native sounds, trending audio, text overlays, captions. Videos 15-60s perform best.",
    instagram: "Instagram Reels: original audio preferred, cover image matters for saves, use carousel for educational content, hashtags in first comment, location tags boost reach.",
    youtube: "YouTube Shorts: loop-friendly content performs well. For long-form: strong thumbnail + title CTR, first 30s must deliver on the title promise, chapters for retention.",
    facebook: "Facebook: emotional content shares more, text posts still get reach, video must caption-readable without sound, peak hours 1-4pm and 7-9pm.",
  };

  const response = await client.messages.create({
    model: MODEL,
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
  return JSON.parse(extractJSON(text));
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
      return `Return JSON with ALL keys: { "hooks": [...5 hooks], "captions": [...3 captions], "hashtag_sets": [...2 sets], "video_ideas": [...5 ideas] }`;
    default:
      return `Return appropriate JSON for the content type.`;
  }
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
