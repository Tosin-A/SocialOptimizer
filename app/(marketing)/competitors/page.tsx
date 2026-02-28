import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users, GitCompareArrows, Hash, TrendingUp, Target, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionReveal from "@/components/landing/SectionReveal";

export const metadata: Metadata = {
  title: "Competitor Tracking",
  description: "Track competitor accounts, compare engagement metrics, and find tactical gaps you can exploit.",
};

const COMPARISON_METRICS = [
  {
    icon: BarChart2,
    label: "Engagement gap",
    description: "See exactly how your engagement rate stacks up against each competitor — in percentage points, not vague terms.",
  },
  {
    icon: TrendingUp,
    label: "Posting frequency gap",
    description: "Are they posting more or less than you? By how much? Know the cadence that's working in your niche.",
  },
  {
    icon: Hash,
    label: "Hashtag differences",
    description: "Hashtags they use that you don't. Hashtags you use that aren't performing. Side-by-side comparison.",
  },
  {
    icon: Target,
    label: "Tactical action plan",
    description: "AI-generated actions ranked by priority: what to steal, what to avoid, and what gaps to exploit.",
  },
];

export default function CompetitorsPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="label-mono mb-4">Competitor Tracking</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Know what&apos;s working for them. Use it.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
            Add any public account in your niche. We pull their engagement rate, posting
            cadence, and top hashtags — then show you exactly where the gaps are.
          </p>
        </div>
      </section>

      {/* How it works */}
      <SectionReveal>
        <section className="pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* Left: description */}
              <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-4">
                  Add a competitor in 10 seconds
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Enter their username and platform. We scrape their public profile for
                  follower count, average engagement rate, posting frequency, and top hashtags.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Data refreshes every 24 hours automatically. No manual re-scraping needed.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Track up to 5 competitors on the free plan, unlimited on Pro.
                </p>
              </div>

              {/* Right: mock competitor card */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-600/30 flex items-center justify-center font-bold text-brand-300 text-sm">
                    JF
                  </div>
                  <div>
                    <div className="font-semibold">@jakefitness</div>
                    <div className="text-xs text-muted-foreground">TikTok &middot; Fitness</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Followers</div>
                    <div className="font-semibold">142K</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Engagement</div>
                    <div className="font-semibold">4.8%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Posts/week</div>
                    <div className="font-semibold">5.2</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["#fitness", "#gym", "#workout", "#gains", "#fitfam"].map((tag) => (
                    <span key={tag} className="text-xs bg-brand-600/20 text-brand-300 px-2 py-0.5 rounded font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* Gap analysis */}
      <SectionReveal>
        <section className="py-16 px-6 border-t border-white/[0.05]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <GitCompareArrows className="w-5 h-5 text-brand-400" />
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Gap analysis
              </h2>
            </div>
            <p className="text-muted-foreground mb-8 max-w-xl">
              Click &ldquo;Compare&rdquo; on any competitor to run a side-by-side gap analysis.
              The AI identifies exactly where you&apos;re ahead, where you&apos;re behind, and
              what to do about it.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {COMPARISON_METRICS.map((metric, i) => (
                <SectionReveal key={metric.label} delay={i * 0.08}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                      <metric.icon className="w-4 h-4 text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">{metric.label}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{metric.description}</p>
                    </div>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* Sample action */}
      <SectionReveal>
        <section className="py-16 px-6 border-t border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold tracking-tight mb-6">
              The kind of actions you get
            </h2>
            <div className="space-y-3">
              <div className="rounded-xl p-4 border border-red-500/20 bg-red-500/5">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">High</span>
                  <div>
                    <p className="text-sm">They post 5.2x/week vs. your 2.1x. Increase to 4x/week minimum — the algorithm rewards consistency above almost everything else on TikTok.</p>
                    <p className="text-xs text-muted-foreground mt-1 italic">Rationale: Accounts in your niche posting 4+ times/week average 2.3x higher reach per post.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-4 border border-yellow-500/20 bg-yellow-500/5">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">Medium</span>
                  <div>
                    <p className="text-sm">They use #gymtok (1.2B views) which you&apos;re missing. Add it to your next 5 posts and track reach delta.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-white/[0.05]">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-semibold tracking-tight mb-3">
            Stop guessing what competitors are doing right
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Track any public account. Get a gap analysis in seconds.
          </p>
          <Button
            size="lg"
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold h-11 px-7 gap-2"
            asChild
          >
            <Link href="/signup">
              Start tracking free <ArrowRight className="w-4 h-4" />
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
