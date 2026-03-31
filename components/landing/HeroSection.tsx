"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SIGNALS, FIXES } from "@/lib/data/landing";
import MetricBar from "./MetricBar";
import ScoreRing from "./ScoreRing";
import BlurText from "./BlurText";

export default function HeroSection() {
  return (
    <section className="pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-32 lg:pb-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="relative max-w-6xl mx-auto text-center">
        {/* Platform pill */}
        <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Content analytics &middot; TikTok &middot; Instagram &middot; YouTube &middot; Facebook
        </div>

        {/* Headline */}
        <BlurText
          as="h1"
          text="The creators outgrowing you aren't luckier. They're more informed."
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight mb-6 mx-auto max-w-5xl text-white font-display justify-center"
          animateBy="words"
          delay={80}
          direction="bottom"
        />

        <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-10 mx-auto max-w-2xl">
          We analyze 90 days of your posts across 4 platforms, scoring hooks, hashtags,
          engagement patterns, CTA placement, and posting cadence. You get a ranked fix
          list, not a generic report.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-16">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold h-11 px-7 gap-2"
            asChild
          >
            <Link href="/signup">
              Analyze my account <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="h-11 px-5 text-muted-foreground hover:text-foreground gap-1.5"
            asChild
          >
            <Link href="/how-it-works#case">
              See a real example <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* ── Dashboard mock ──────────────────────────────────── */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">

          {/* Window chrome */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/50">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <span className="font-mono text-xs text-muted-foreground ml-2 hidden sm:inline">
              clout &middot; @cookswithjordan &middot; instagram &middot; 90-day analysis
            </span>
            <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-status-good">
              <span className="w-1.5 h-1.5 rounded-full bg-status-good" />
              complete
            </div>
          </div>

          {/* Three-column body */}
          <div className="grid md:grid-cols-[180px_1fr_180px] lg:grid-cols-[200px_1fr_200px] divide-y md:divide-y-0 md:divide-x divide-border">

            {/* Score panel */}
            <div className="p-4 sm:p-6">
              <div className="label-mono mb-5">Growth score</div>
              <ScoreRing score={74} />
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-status-good text-xs font-mono">&uarr; +12 pts</span>
                  <span className="text-muted-foreground text-xs">vs. 30 days ago</span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">48 posts &middot; 90 days</div>
                <div className="text-xs text-muted-foreground font-mono">instagram &middot; public</div>
              </div>
            </div>

            {/* Signal breakdown */}
            <div className="p-4 sm:p-6">
              <div className="label-mono mb-5">Signal breakdown</div>
              <div className="space-y-5">
                {SIGNALS.map((s) => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    <MetricBar value={s.score} />
                    <p className="text-[11px] text-muted-foreground font-mono mt-1.5 leading-snug">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority fixes — hidden on mobile */}
            <div className="p-6 hidden md:block">
              <div className="label-mono mb-5">Priority fixes</div>
              <div className="space-y-5">
                {FIXES.map((f) => (
                  <div key={f.rank} className="flex gap-3">
                    <span className="font-mono text-xs text-muted-foreground/30 flex-shrink-0 mt-0.5">
                      {f.rank}
                    </span>
                    <div>
                      <div className="text-sm font-medium leading-snug mb-1">{f.label}</div>
                      <span
                        className={`inline-block text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          f.impact === "high"
                            ? "bg-blue-500/15 text-blue-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {f.impact} impact
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                        {f.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        <p className="text-xs text-muted-foreground font-mono mt-3">
          example output &middot; based on a real account, anonymized &middot; numbers verified by creator
        </p>
      </div>
    </section>
  );
}
