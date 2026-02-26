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

// ─── Content generation ───────────────────────────────────────────────────────

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
