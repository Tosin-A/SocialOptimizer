const CAPTION_TEMPLATES = [
  "I put my TikTok into this AI and it told me why it flopped\nTry it yourself: {publicUrl}",
  "My content score: {score}/100... I need to fix my {topIssue}\n{publicUrl}",
  "This AI roasted my TikTok content and it was painfully accurate\n{publicUrl}",
  "Got my content analyzed by AI. {score}/100 and the fixes are brutal\n{publicUrl}",
  "POV: an AI tells you exactly why your content isn't growing\n{publicUrl}",
];

export function generateShareCaption(params: {
  score: number;
  topIssue: string;
  publicUrl: string;
}): string {
  const template = CAPTION_TEMPLATES[Math.floor(Math.random() * CAPTION_TEMPLATES.length)];
  return template
    .replace("{score}", String(params.score))
    .replace("{topIssue}", params.topIssue)
    .replace("{publicUrl}", params.publicUrl);
}
