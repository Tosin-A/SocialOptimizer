import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const IDEAS_SYSTEM_PROMPT = `You are a creative content strategist for social media creators. Your job is to generate specific, actionable content ideas — not generic advice.

Rules:
- Every idea must include a concrete hook, format, and angle — not just a topic.
- Tailor ideas to the creator's niche and platform. A fitness TikToker needs different ideas than a cooking YouTuber.
- Include specific hooks (first 3 seconds / first line) for each idea.
- Suggest trending formats, sounds, or structures when relevant.
- Be bold and opinionated. "Post consistently" is useless. "Film a 'What I Eat in a Day' with a controversial take on protein timing" is useful.
- If brand pillars are provided, weave them naturally into ideas without forcing every pillar into every idea.
- If analysis report data is provided, USE IT. Reference specific metrics — engagement rates, hook scores, top formats, content themes, weaknesses — to ground your ideas in what actually works for this creator. Lean into their strengths and address their weaknesses with creative solutions.
- Output in clean markdown with numbered ideas. Each idea should have: Title, Hook, Format, Why it works (1 sentence).`;

interface IdeasMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateIdeas(
  messages: IdeasMessage[],
  niche?: string,
  platform?: string,
  brandPillars?: string[],
  analysisContext?: string
): Promise<string> {
  const contextParts: string[] = [];
  if (niche) contextParts.push(`Creator niche: ${niche}`);
  if (platform) contextParts.push(`Primary platform: ${platform}`);
  if (brandPillars && brandPillars.length > 0) {
    contextParts.push(`Brand pillars: ${brandPillars.join(", ")}`);
  }
  if (analysisContext) {
    contextParts.push(`\nAnalysis report data:\n${analysisContext}`);
  }

  const systemContent = contextParts.length > 0
    ? `${IDEAS_SYSTEM_PROMPT}\n\nCreator context:\n${contextParts.join("\n")}`
    : IDEAS_SYSTEM_PROMPT;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemContent },
      ...messages,
    ],
    max_tokens: 2000,
    temperature: 0.9,
  });

  return response.choices[0]?.message?.content ?? "No ideas generated. Try again with more context.";
}
