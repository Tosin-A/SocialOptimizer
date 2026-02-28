import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Printer, Download, TrendingUp, BarChart3, Hash, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionReveal from "@/components/landing/SectionReveal";

export const metadata: Metadata = {
  title: "Reports",
  description: "Structured analysis reports with growth scores, engagement breakdowns, and prioritized improvement roadmaps.",
};

const REPORT_SECTIONS = [
  {
    icon: TrendingUp,
    title: "Growth Score",
    description: "A single 0–100 score combining engagement rate, content quality, and posting consistency. Benchmarked against your niche median.",
  },
  {
    icon: BarChart3,
    title: "Engagement Breakdown",
    description: "Per-post engagement rates, like/comment/share ratios, and retention signals. See exactly which posts pulled weight and which didn't.",
  },
  {
    icon: Hash,
    title: "Hashtag Analysis",
    description: "Which hashtags drive reach vs. which are dead weight. Competitor hashtag gaps. Recommended sets based on your niche and content type.",
  },
  {
    icon: Lightbulb,
    title: "Prioritized Roadmap",
    description: "Ranked list of changes by expected impact. Not vague advice — specific actions like 'switch to question hooks' or 'post at 7pm EST on Tuesdays.'",
  },
];

const REPORT_FEATURES = [
  { icon: FileText, label: "Full report history", description: "Every analysis is saved. Compare your scores over time to track actual progress." },
  { icon: Printer, label: "Print-ready PDF export", description: "One-click PDF export for client presentations, team reviews, or your own records." },
  { icon: Download, label: "CSV data export", description: "Download raw metric data for your own spreadsheets and custom analysis." },
];

export default function ReportsPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="label-mono mb-4">Reports</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Data you can act on. Not dashboards you stare at.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
            Every report is a structured document: scores, breakdowns, and a prioritized
            list of what to change — ordered by how much it&apos;ll move the needle.
          </p>
        </div>
      </section>

      {/* Report sections */}
      <section className="pb-16 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-6">
          {REPORT_SECTIONS.map((section, i) => (
            <SectionReveal key={section.title} delay={i * 0.1}>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 h-full">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
                  <section.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{section.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{section.description}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* Sample report preview */}
      <SectionReveal>
        <section className="py-16 px-6 border-t border-white/[0.05]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
              What a report looks like
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl">
              Here&apos;s a snapshot from a real analysis. Every number links back to
              specific posts in your feed.
            </p>

            {/* Mock report card */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <span className="text-pink-400 font-bold text-sm">IG</span>
                </div>
                <div>
                  <div className="font-semibold">@fitnesswithmaya</div>
                  <div className="text-xs text-muted-foreground">Instagram &middot; Fitness &middot; 24.3K followers</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400">72</div>
                  <div className="text-xs text-muted-foreground mt-1">Growth Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">3.4%</div>
                  <div className="text-xs text-muted-foreground mt-1">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">4.2</div>
                  <div className="text-xs text-muted-foreground mt-1">Posts/week</div>
                </div>
              </div>

              <div className="border-t border-white/[0.05] pt-4 space-y-2">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide">Top insight</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  &ldquo;Your Reel posts average 4.1% engagement vs. 1.8% for carousel posts.
                  Shifting 2 of your weekly carousels to Reels should increase overall engagement
                  by ~30%.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* Export features */}
      <SectionReveal>
        <section className="py-16 px-6 border-t border-white/[0.05]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold tracking-tight mb-8">
              Export and share
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {REPORT_FEATURES.map((feature) => (
                <div key={feature.label} className="flex items-start gap-3">
                  <feature.icon className="w-5 h-5 text-brand-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium mb-1">{feature.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-white/[0.05]">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-semibold tracking-tight mb-3">
            Get your first report
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Connect an account, run the analysis, and see exactly where you stand.
          </p>
          <Button
            size="lg"
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold h-11 px-7 gap-2"
            asChild
          >
            <Link href="/signup">
              Start free <ArrowRight className="w-4 h-4" />
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
