import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Wand2, MessageSquare, Video, Hash, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionReveal from "@/components/landing/SectionReveal";

export const metadata: Metadata = {
  title: "Content Generator",
  description: "AI-generated hooks, captions, scripts, and hashtag sets personalized to your niche and platform.",
};

const CONTENT_TYPES = [
  {
    icon: MessageSquare,
    title: "Hooks",
    description: "Opening lines that stop the scroll. Each hook is tagged with its type (question, statistic, story, bold claim) and expected retention level.",
    example: "\"You're losing 40% of your viewers in the first 2 seconds — here's why.\"",
  },
  {
    icon: FileText,
    title: "Captions + Hashtags",
    description: "Full captions with CTAs and optimized hashtag sets. Copy-paste ready. Each caption includes a clear call-to-action and relevant hashtags for your niche.",
    example: null,
  },
  {
    icon: Video,
    title: "Video Scripts",
    description: "Structured outlines with hook, body, and CTA sections. Formatted for TikTok, Reels, or Shorts. Each script includes angle, format, and why it works.",
    example: null,
  },
  {
    icon: Hash,
    title: "Hashtag Sets",
    description: "Strategic hashtag combinations: high-reach discovery tags mixed with niche-specific tags. Each set has a name and strategy explanation.",
    example: null,
  },
];

const TONES = ["Educational", "Entertaining", "Inspirational", "Controversial", "Storytelling"];

export default function GeneratePage() {
  return (
    <>
      {/* Header */}
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="label-mono mb-4">Content Generator</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Write less. Post better.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
            AI-generated hooks, captions, scripts, and hashtags — tailored to your platform,
            niche, and tone. Not generic templates. Content that sounds like you, backed by
            what actually performs.
          </p>
        </div>
      </section>

      {/* Content types */}
      <section className="pb-16 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-6">
          {CONTENT_TYPES.map((type, i) => (
            <SectionReveal key={type.title} delay={i * 0.1}>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 h-full">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
                  <type.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{type.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{type.description}</p>
                {type.example && (
                  <div className="mt-4 bg-white/[0.03] rounded-lg p-3 border border-white/[0.04]">
                    <p className="text-sm italic text-muted-foreground">{type.example}</p>
                  </div>
                )}
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <SectionReveal>
        <section className="py-16 px-6 border-t border-white/[0.05]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                Built on your analysis data
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The generator doesn&apos;t just know your niche — it knows your top-performing
                content patterns from your analysis reports. It writes hooks in the style that
                already works for your audience.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Choose your platform, niche, topic, tone, and how many variations you want.
                Get results in seconds. Save favorites to your history for later.
              </p>

              {/* Tones */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide">Available tones</div>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((tone) => (
                    <span key={tone} className="text-xs px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                      {tone}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Mock output */}
            <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span className="font-semibold text-sm">Generated hooks — fitness / educational</span>
              </div>
              <div className="space-y-3">
                {[
                  { text: "Your bench press form is costing you 30% of your gains.", retention: "high", type: "bold claim" },
                  { text: "I tracked my protein intake for 90 days. Here's what actually happened.", retention: "high", type: "story" },
                  { text: "Why do most people plateau at 3 months? It's not what you think.", retention: "medium", type: "question" },
                ].map((hook, i) => (
                  <div key={i} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.04] space-y-1.5">
                    <p className="text-sm font-medium">&ldquo;{hook.text}&rdquo;</p>
                    <div className="flex gap-2 text-xs">
                      <span className="bg-white/[0.05] px-2 py-0.5 rounded text-muted-foreground">{hook.type}</span>
                      <span className={`px-2 py-0.5 rounded ${hook.retention === "high" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                        {hook.retention} retention
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* Full plan */}
      <SectionReveal>
        <section className="py-16 px-6 border-t border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-5 h-5 text-neon-purple" />
              <h2 className="text-2xl font-semibold tracking-tight">Full content plan mode</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Select &ldquo;Full content plan&rdquo; to generate everything at once: hooks, captions
              with hashtags, video scripts, and ideas — all for the same topic. One click, complete
              content package.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Every generation is saved to your history. Come back to it anytime, copy individual
              pieces, or re-generate with different parameters.
            </p>
          </div>
        </section>
      </SectionReveal>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-white/[0.05]">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-semibold tracking-tight mb-3">
            Generate your first batch
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Pick your niche, choose a topic, and get scroll-stopping content in seconds.
          </p>
          <Button
            size="lg"
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold h-11 px-7 gap-2"
            asChild
          >
            <Link href="/signup">
              Try the generator free <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            No card required &middot; free plan available
          </p>
        </div>
      </section>
    </>
  );
}
