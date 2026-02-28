import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Zap, Target, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionReveal from "@/components/landing/SectionReveal";

export const metadata: Metadata = {
  title: "Content Analysis",
  description: "Deep AI analysis of your posts, hashtags, and engagement patterns across TikTok, Instagram, YouTube, and Facebook.",
};

const ANALYSIS_STEPS = [
  {
    icon: Zap,
    title: "Connect your account",
    description: "OAuth login for TikTok, Instagram, YouTube, or Facebook. We pull your last 10–100 posts automatically.",
  },
  {
    icon: BarChart3,
    title: "AI scores every post",
    description: "Hook strength, CTA usage, hashtag effectiveness, posting cadence, engagement rate — scored against platform-specific benchmarks.",
  },
  {
    icon: Target,
    title: "Get a prioritized roadmap",
    description: "Not 'post more.' Specific fixes ranked by expected impact: which hashtags to drop, when to post, what hook patterns perform best in your niche.",
  },
];

const METRICS_ANALYZED = [
  "Growth score (0–100)",
  "Engagement rate vs. niche median",
  "Hook strength per post",
  "CTA usage rate",
  "Hashtag effectiveness score",
  "Posting cadence analysis",
  "Content quality breakdown",
  "Top-performing post patterns",
  "Audience retention signals",
  "Platform-specific algorithm fit",
];

export default function AnalyzePage() {
  return (
    <>
      {/* Header */}
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="label-mono mb-4">Content Analysis</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Every post. Scored and ranked.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
            Our AI reads every post on your profile, scores it against known growth patterns,
            and tells you exactly what to fix — with numbers, not opinions.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {ANALYSIS_STEPS.map((step, i) => (
              <SectionReveal key={step.title} delay={i * 0.1}>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 h-full">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">Step {i + 1}</div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* What we analyze */}
      <SectionReveal>
        <section className="py-16 px-6 border-t border-white/[0.05]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
              What the analysis covers
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl">
              Each analysis runs your content through 10+ scoring dimensions. Every metric
              traces back to engagement data — nothing is guessed.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {METRICS_ANALYZED.map((metric) => (
                <div key={metric} className="flex items-center gap-3 text-sm py-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  <span>{metric}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* Speed callout */}
      <SectionReveal>
        <section className="py-16 px-6 border-t border-white/[0.05]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-brand-400" />
                <h2 className="text-2xl font-semibold tracking-tight">3 minutes, not 3 hours</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A manual audit of 50 posts takes a skilled analyst 2–3 hours. Our pipeline
                does it in under 3 minutes, with more consistency and zero blind spots.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The analysis runs async — start it, close the tab, come back to a full report.
                No waiting around.
              </p>
            </div>
            <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold">Sample output</span>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>&ldquo;Your CTA usage rate of 23% is 2.7x below the fitness niche median of 61%.
                  Adding a direct CTA to your next 10 posts should increase comment rate by 15–25%.&rdquo;</p>
                <p>&ldquo;Your top 3 posts all used question-based hooks. Your bottom 5 all opened with
                  statements. Switch to questions for your next batch.&rdquo;</p>
              </div>
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-white/[0.05]">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-semibold tracking-tight mb-3">
            See what your posts are actually doing
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Connect an account and get your first analysis free. Takes under 3 minutes.
          </p>
          <Button
            size="lg"
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold h-11 px-7 gap-2"
            asChild
          >
            <Link href="/signup">
              Start free analysis <ArrowRight className="w-4 h-4" />
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
