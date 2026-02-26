import Link from "next/link";
import { ArrowRight, BarChart3, Check, ChevronRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Chart primitives ─────────────────────────────────────────────────────────

function MetricBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color =
    value >= 7 ? "#22c55e" :
    value >= 4 ? "#eab308" : "#ef4444";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs w-10 text-right tabular-nums" style={{ color }}>
        {value}/10
      </span>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color =
    score >= 70 ? "#22c55e" :
    score >= 45 ? "#eab308" : "#ef4444";
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
        <circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
        />
      </svg>
      <div className="text-center">
        <div className="font-mono font-semibold text-xl leading-none" style={{ color }}>
          {score}
        </div>
        <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">
          /100
        </div>
      </div>
    </div>
  );
}

function Sparkline({
  data,
  height = 52,
  color = "#6366f1",
  markerAt,
}: {
  data: number[];
  height?: number;
  color?: string;
  markerAt?: number;
}) {
  const W = 480;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = (subset: number[], startIdx: number) =>
    subset
      .map((v, i) => {
        const x = ((startIdx + i) / (data.length - 1)) * W;
        const y = height - ((v - min) / range) * (height - 6) - 3;
        return `${x},${y}`;
      })
      .join(" ");

  const allPts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return [x, y] as [number, number];
  });

  const areaPath = [
    `0,${height}`,
    ...allPts.map(([x, y]) => `${x},${y}`),
    `${W},${height}`,
  ].join(" ");

  const splitAt = markerAt ?? data.length;
  const beforePts = pts(data.slice(0, splitAt + 1), 0);
  const afterPts = pts(data.slice(splitAt), splitAt);
  const markerX = markerAt != null ? (markerAt / (data.length - 1)) * W : null;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPath} fill="url(#areaGrad)" />
      {markerAt != null && (
        <>
          <polyline
            points={beforePts}
            fill="none"
            stroke={`${color}55`}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points={afterPts}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      )}
      {markerAt == null && (
        <polyline
          points={pts(data, 0)}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {markerX != null && (
        <line
          x1={markerX} y1="0"
          x2={markerX} y2={height}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
      )}
    </svg>
  );
}

// ─── Static data ───────────────────────────────────────────────────────────────

const SIGNALS = [
  { name: "Hook quality",        score: 3.2, desc: "How well the opening earns continued reading" },
  { name: "Hashtag efficiency",  score: 4.8, desc: "Tag specificity vs. competition volume" },
  { name: "CTA placement",       score: 2.1, desc: "Ask visibility relative to caption drop-off" },
  { name: "Posting cadence",     score: 8.3, desc: "Frequency and timing vs. audience activity" },
  { name: "Content consistency", score: 6.7, desc: "Format and topic variance across 90 days" },
];

const FIXES = [
  { rank: "01", label: "Rewrite caption openers",  impact: "high",   detail: "All 48 posts start with context, not a hook" },
  { rank: "02", label: "Cut hashtags to 6 niche",  impact: "high",   detail: "Currently 22/post — drop #food, #recipe" },
  { rank: "03", label: "Add CTA before the fold",  impact: "medium", detail: "Missing or buried in 80% of captions" },
  { rank: "04", label: "Shift to 6–8 pm window",   impact: "medium", detail: "Audience peak is 3h after current timing" },
];

const PLATFORMS = [
  {
    name:        "TikTok",
    color:       "#25F4EE",
    bg:          "rgba(37,244,238,0.05)",
    border:      "rgba(37,244,238,0.14)",
    accounts:    "920+",
    metrics: [
      "Hook within first 1.5 seconds",
      "Caption structure and CTA",
      "Sound and trend alignment",
      "Posting time vs. FYP window",
      "Duet / stitch engagement rate",
    ],
  },
  {
    name:        "Instagram",
    color:       "#E1306C",
    bg:          "rgba(225,48,108,0.05)",
    border:      "rgba(225,48,108,0.14)",
    accounts:    "640+",
    metrics: [
      "Caption hook and CTA depth",
      "Hashtag specificity score",
      "Story vs. feed performance split",
      "Save-rate proxies from engagement",
      "Reel vs. static format efficiency",
    ],
  },
  {
    name:        "YouTube",
    color:       "#FF0000",
    bg:          "rgba(255,0,0,0.05)",
    border:      "rgba(255,0,0,0.14)",
    accounts:    "280+",
    metrics: [
      "Title pattern and click-bait score",
      "Thumbnail hook assessment",
      "First-30s retention signals",
      "Description CTA presence",
      "Upload frequency and cadence",
    ],
  },
  {
    name:        "Facebook",
    color:       "#1877F2",
    bg:          "rgba(24,119,242,0.05)",
    border:      "rgba(24,119,242,0.14)",
    accounts:    "160+",
    metrics: [
      "Post format mix (text / video / link)",
      "Caption length vs. engagement",
      "Peak timing analysis",
      "Group vs. page performance delta",
      "CTA type effectiveness",
    ],
  },
];

const FINDINGS = [
  {
    stat: "3.2×",
    unit: "reach lift",
    finding: "5–7 niche hashtags vs. 20+",
    detail:
      "Accounts using 5–7 tags in the 50K–500K post range consistently outperformed those flooding posts with broad tags. Pattern held in 74% of analyzed accounts.",
  },
  {
    stat: "67%",
    unit: "of reads",
    finding: "decided by the first sentence",
    detail:
      "If the first line explains context rather than earning attention, most readers are gone before line two. This is measurable from save and share patterns across the full dataset.",
  },
  {
    stat: "4.1×",
    unit: "posts/week",
    finding: "correlates with fastest account growth",
    detail:
      "Not 7. Not 1. Consistent 4× posting with strong hooks outperforms daily posting with weak openers. Frequency without quality makes performance worse, not better.",
  },
];

const CASE_DATA = [1.1, 1.3, 1.2, 1.0, 1.4, 1.2, 2.1, 2.8, 3.3, 3.9, 4.3, 4.8];

const CASE_CHANGES = [
  {
    action: "Hashtag cut: 22 → 6",
    result:
      "Dropped all broad tags. Replaced with 6 niche-specific ones under 500K posts. Reach per post increased within 3 days of the first post with the new set.",
  },
  {
    action: "Caption opener rewrite",
    result:
      "Every caption was opening with 'Today I'm making…'. Switched to question-first and specific-detail openers. First test post got 4× the usual saves.",
  },
  {
    action: "Vague CTA → specific ask",
    result:
      "'Let me know below!' became 'Save this for your next dinner party' — one change, saves doubled within two weeks.",
  },
];

const FAQ = [
  {
    q: "Do you need my password or account access?",
    a: "No. We pull public post data via platform scraping. For private engagement metrics on Instagram and YouTube, you can optionally grant read-only API access through an OAuth flow — no password required.",
  },
  {
    q: "How is this different from the platform's native analytics?",
    a: "Native analytics show you what happened. We tell you why and what to fix. We score every post against known engagement patterns — hook quality, hashtag specificity, CTA placement — and give you a ranked list ordered by expected impact.",
  },
  {
    q: "How often should I re-analyze?",
    a: "After making changes, wait 2–3 weeks and run another analysis. That's enough posts for the data to reflect your edits. Running it every day gives noise, not signal.",
  },
  {
    q: "What counts as one 'analysis'?",
    a: "One analysis = one account × one run. A 90-day scan of your TikTok is one analysis. Running it again next week is a second analysis. Connected accounts don't count against the limit on their own.",
  },
  {
    q: "Can I analyze a competitor's account?",
    a: "Yes, on Pro and Agency plans. The competitor tracking feature pulls their public data and compares it against yours — follower velocity, posting cadence, hashtag overlap, and engagement gap.",
  },
  {
    q: "What if I cancel Pro mid-month?",
    a: "You keep Pro access until the end of the billing period. No prorated refunds, no data deletion. Your analysis history stays accessible on the free tier.",
  },
];

const LIMITS = [
  {
    title: "Private metrics are inaccessible",
    body: "Real reach, story views, and saves-per-post require platform API access pending app review. We analyze public engagement data — directionally accurate, not a replacement for native analytics.",
  },
  {
    title: "AI hook suggestions need editing",
    body: "The generator produces 10 options. About 3 will be unusable. Pick 2 that sound like you and test them. We're not claiming magic copywriting.",
  },
  {
    title: "Non-English content is inconsistent",
    body: "Spanish and Portuguese work reasonably well. Other languages produce unreliable scoring. We'd rather say this now than after sign-up.",
  },
  {
    title: "Competitor data is from public profiles only",
    body: "Follower counts and posting cadence are reliable. Engagement rates are estimated from visible interactions. Private accounts return nothing.",
  },
];

const TIERS = [
  {
    name:    "Free",
    price:   "$0",
    cadence: "forever",
    note:    "Test whether this is useful before committing",
    features: [
      "3 analyses / month",
      "1 connected platform",
      "5 content generations",
      "Basic growth score",
    ],
    missing: ["Competitor tracking", "Unlimited analyses", "Multi-platform"],
    cta:     "Start free",
    href:    "/signup",
    accent:  false,
  },
  {
    name:    "Pro",
    price:   "$29",
    cadence: "/month",
    note:    "For creators who want to act on the data",
    features: [
      "Unlimited analyses",
      "4 platforms simultaneously",
      "Competitor gap analysis",
      "Unlimited content generation",
      "Full ranked fix roadmap",
      "Email support",
    ],
    missing: [],
    cta:    "Get Pro",
    href:   "/signup?plan=pro",
    accent: true,
  },
  {
    name:    "Agency",
    price:   "$99",
    cadence: "/month",
    note:    "For teams managing multiple creator accounts",
    features: [
      "Up to 10 accounts",
      "White-label PDF reports",
      "API access",
      "Slack notifications",
      "Priority support",
    ],
    missing: [],
    cta:    "Contact us",
    href:   "mailto:hi@socialoptimizer.co",
    accent: false,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-sm">
            <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            SocialOptimizer
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="#platforms" className="hover:text-foreground transition-colors">Platforms</Link>
            <Link href="#how"       className="hover:text-foreground transition-colors">How it works</Link>
            <Link href="#case"      className="hover:text-foreground transition-colors">Case study</Link>
            <Link href="#faq"       className="hover:text-foreground transition-colors">FAQ</Link>
            <Link href="#pricing"   className="hover:text-foreground transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              size="sm"
              className="bg-brand-500 hover:bg-brand-600 text-white font-medium gap-1.5"
              asChild
            >
              <Link href="/signup">
                Get started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden">
        {/* Dot-grid background */}
        <div className="dot-grid absolute inset-0 pointer-events-none" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        {/* Subtle indigo glow behind dashboard */}
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          {/* Platform pill */}
          <div className="inline-flex items-center gap-2 text-xs font-mono text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-full px-3 py-1 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Content analytics · TikTok · Instagram · YouTube · Facebook
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-[68px] font-semibold leading-[1.06] tracking-tight mb-6 max-w-3xl">
            Know exactly what&apos;s<br />
            costing you growth.
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl">
            We analyze 90 days of your posts across 4 platforms — scoring hooks, hashtags,
            engagement patterns, CTA placement, and posting cadence. You get a ranked fix
            list, not a generic report.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-16">
            <Button
              size="lg"
              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold h-11 px-7 gap-2"
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
              <Link href="#case">
                See a real example <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* ── Dashboard mock ───────────────────────────────────────────── */}
          <div className="rounded-xl border border-white/[0.08] overflow-hidden"
               style={{ background: "#0a1120" }}>

            {/* Window chrome */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.05]"
                 style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              </div>
              <span className="font-mono text-xs text-muted-foreground ml-2">
                socialoptimizer · @cookswithjordan · instagram · 90-day analysis
              </span>
              <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-status-good">
                <span className="w-1.5 h-1.5 rounded-full bg-status-good" />
                complete
              </div>
            </div>

            {/* Three-column body */}
            <div className="grid md:grid-cols-[200px_1fr_200px] divide-y md:divide-y-0 md:divide-x divide-white/[0.05]">

              {/* Score panel */}
              <div className="p-6">
                <div className="label-mono mb-5">Growth score</div>
                <ScoreRing score={74} />
                <div className="mt-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-status-good text-xs font-mono">↑ +12 pts</span>
                    <span className="text-muted-foreground text-xs">vs. 30 days ago</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">48 posts · 90 days</div>
                  <div className="text-xs text-muted-foreground font-mono">instagram · public</div>
                </div>
              </div>

              {/* Signal breakdown */}
              <div className="p-6">
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

              {/* Priority fixes */}
              <div className="p-6">
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
                              ? "bg-brand-500/15 text-brand-400"
                              : "bg-white/[0.05] text-muted-foreground"
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
            example output · based on a real account, anonymized · numbers verified by creator
          </p>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <div className="border-y border-white/[0.05] bg-white/[0.01] py-5 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "2,000+",   label: "accounts analyzed" },
            { value: "4",        label: "platforms covered" },
            { value: "90 days",  label: "data window" },
            { value: "5",        label: "growth signals scored" },
          ].map((item) => (
            <div key={item.label}>
              <div className="font-mono font-semibold text-xl tabular-nums">{item.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Platforms ────────────────────────────────────────────────────── */}
      <section id="platforms" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="label-mono mb-4">Platforms</div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
              One report. Four platforms.
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Each platform has different algorithms and signal weightings. We analyze them
              separately and surface what matters for each one.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="rounded-lg p-5 border"
                style={{ background: p.bg, borderColor: p.border }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-sm" style={{ color: p.color }}>
                    {p.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{p.accounts}</span>
                </div>
                <ul className="space-y-2">
                  {p.metrics.map((m) => (
                    <li key={m} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-brand-400 flex-shrink-0 mt-0.5">›</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="py-20 px-6 border-y border-white/[0.05] bg-white/[0.015]">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-24">
          <div className="lg:w-72 flex-shrink-0">
            <div className="label-mono mb-4">How it works</div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
              Three steps.<br />No magic.
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We&apos;re doing what a smart analyst would do manually — reading every post,
              scoring it against known patterns — in 3 minutes instead of 3 hours.
            </p>
          </div>

          <div className="flex-1">
            {[
              {
                n: "1",
                title: "Connect your platform",
                body: "We pull the last 90 days of your public posts. For private metrics, you authorize read-only access. Takes 90 seconds, nothing stored beyond what the analysis requires.",
              },
              {
                n: "2",
                title: "We run the analysis",
                body: "Hook scoring, hashtag specificity, engagement pattern detection, CTA placement, posting cadence. Finishes in 2–4 minutes. Every post is analyzed, not a sample.",
              },
              {
                n: "3",
                title: "You get a ranked fix list",
                body: "Not a PDF. A short list ordered by expected impact. The item at the top is what to fix first. Re-analyze in two weeks and track whether the score moves.",
              },
            ].map((step, i, arr) => (
              <div
                key={i}
                className={`flex gap-6 py-7 ${i < arr.length - 1 ? "border-b border-white/[0.05]" : ""}`}
              >
                <div className="w-7 h-7 rounded-full border border-brand-500/40 text-brand-400 font-mono text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.n}
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1.5">{step.title}</div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Findings ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="label-mono mb-4">What the data shows</div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
              Patterns from 2,000+ accounts.
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Not industry benchmarks or platform documentation. Actual numbers from
              accounts we&apos;ve run through the system.
            </p>
          </div>

          {FINDINGS.map((f, i) => (
            <div
              key={i}
              className={`flex flex-col md:flex-row gap-8 md:gap-16 py-10 border-t border-white/[0.05] ${
                i === FINDINGS.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="md:w-52 flex-shrink-0">
                <div className="font-mono font-semibold text-5xl text-brand-400 leading-none mb-1 tabular-nums">
                  {f.stat}
                </div>
                <div className="text-xs text-muted-foreground font-mono">{f.unit}</div>
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-2">{f.finding}</div>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Case study ───────────────────────────────────────────────────── */}
      <section id="case" className="py-20 px-6 border-y border-white/[0.05] bg-white/[0.015]">
        <div className="max-w-6xl mx-auto">
          <div className="label-mono mb-4">Case study</div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            @cookswithjordan — 6 weeks
          </h2>
          <p className="text-muted-foreground text-sm mb-12">
            Instagram · cooking · numbers verified by the creator
          </p>

          <div className="grid lg:grid-cols-[1fr_320px] gap-12 lg:gap-16 items-start">

            {/* Changes + sparkline */}
            <div>
              <div className="space-y-8 mb-10">
                {CASE_CHANGES.map((c, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="w-6 h-6 rounded-full border border-brand-500/40 text-brand-400 text-xs font-mono flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-sm mb-1.5">{c.action}</div>
                      <p className="text-muted-foreground text-sm leading-relaxed">{c.result}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sparkline card */}
              <div className="rounded-lg border border-white/[0.07] p-5"
                   style={{ background: "#0a1120" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="label-mono">Engagement rate · 12 weeks</div>
                  <span className="text-xs font-mono text-muted-foreground">
                    1.2% → 4.8%
                  </span>
                </div>
                <Sparkline
                  data={CASE_DATA}
                  height={56}
                  color="#6366f1"
                  markerAt={5}
                />
                <div className="flex justify-between mt-2 text-[10px] font-mono text-muted-foreground/50">
                  <span>Week 1</span>
                  <span className="text-white/25">analysis applied ↑</span>
                  <span>Week 12</span>
                </div>
              </div>
            </div>

            {/* Before / After */}
            <div className="rounded-lg border border-white/[0.07] overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-white/[0.05]">
                {(["before", "after"] as const).map((key) => {
                  const d =
                    key === "before"
                      ? { score: 41, eng: "1.2%", followers: "18K", tags: 22 }
                      : { score: 79, eng: "4.8%", followers: "52K", tags: 6 };
                  const isAfter = key === "after";
                  return (
                    <div key={key} className="p-5">
                      <div className="label-mono mb-5">{key}</div>
                      {[
                        { v: String(d.score), l: "growth score" },
                        { v: d.eng,           l: "eng. rate" },
                        { v: d.followers,     l: "followers" },
                        { v: String(d.tags),  l: "tags / post" },
                      ].map(({ v, l }) => (
                        <div key={l} className="mb-4">
                          <div
                            className={`font-mono font-semibold text-2xl leading-none mb-0.5 tabular-nums ${
                              isAfter ? "text-status-good" : ""
                            }`}
                          >
                            {v}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{l}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3 border-t border-white/[0.05] bg-white/[0.01]">
                <p className="text-[11px] text-muted-foreground">
                  6 weeks between first and second analysis
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Limitations ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-14 lg:gap-24">
          <div className="lg:w-72 flex-shrink-0">
            <div className="label-mono mb-4">Honest</div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
              What we can&apos;t do
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Every tool overpromises. Here are the real constraints — decide whether
              this fits before you sign up.
            </p>
          </div>
          <div className="flex-1">
            {LIMITS.map((l, i) => (
              <div
                key={i}
                className={`py-6 border-t border-white/[0.05] ${
                  i === LIMITS.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="font-medium text-sm mb-1.5">{l.title}</div>
                <p className="text-muted-foreground text-sm leading-relaxed">{l.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6 border-y border-white/[0.05] bg-white/[0.015]">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-14 lg:gap-24">
          <div className="lg:w-72 flex-shrink-0">
            <div className="label-mono mb-4">FAQ</div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
              Common questions.
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Answers to what most people ask before signing up.
            </p>
          </div>
          <div className="flex-1">
            {FAQ.map((item, i) => (
              <details
                key={i}
                className={`group py-5 border-t border-white/[0.05] ${i === FAQ.length - 1 ? "border-b" : ""}`}
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none select-none">
                  <span className="font-medium text-sm">{item.q}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-open:rotate-90 transition-transform duration-200" />
                </summary>
                <p className="text-muted-foreground text-sm leading-relaxed mt-3 pr-8">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6 border-y border-white/[0.05] bg-white/[0.015]">
        <div className="max-w-6xl mx-auto">
          <div className="label-mono mb-4">Pricing</div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            Simple. No tricks.
          </h2>
          <p className="text-muted-foreground mb-12">
            Start free. Upgrade when it&apos;s actually worth it to you.
          </p>

          <div className="grid md:grid-cols-3 gap-5">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-lg p-6 flex flex-col border ${
                  tier.accent
                    ? "border-brand-500/40 bg-brand-950/20"
                    : "border-white/[0.07] bg-white/[0.02]"
                }`}
                style={
                  tier.accent
                    ? { boxShadow: "0 0 48px rgba(99,102,241,0.08)" }
                    : {}
                }
              >
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{tier.name}</span>
                    {tier.accent && (
                      <span className="text-[10px] font-mono text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-full px-2 py-0.5 uppercase tracking-wider">
                        popular
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-mono font-semibold text-3xl tabular-nums">{tier.price}</span>
                    <span className="text-muted-foreground text-sm">{tier.cadence}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{tier.note}</p>
                </div>

                <div className="flex-1 space-y-2.5 mb-6">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                  {tier.missing.map((f) => (
                    <div key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground/35">
                      <Minus className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-40" />
                      <span className="line-through">{f}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  variant={tier.accent ? "default" : "outline"}
                  className={
                    tier.accent
                      ? "bg-brand-500 hover:bg-brand-600 text-white font-semibold w-full"
                      : "w-full border-white/[0.1] hover:bg-white/[0.04]"
                  }
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Pro cancels any time. No retention flow. No &quot;are you sure?&quot; email.
          </p>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Your next post goes out either way.
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            The analysis takes 3 minutes. You&apos;ll probably see something you didn&apos;t
            expect — that&apos;s the point.
          </p>
          <Button
            size="lg"
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold h-11 px-8 gap-2"
            asChild
          >
            <Link href="/signup">
              Analyze my account free <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            No card required · free plan available
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground/70">
            <div className="w-5 h-5 rounded bg-brand-500/80 flex items-center justify-center">
              <BarChart3 className="w-3 h-3 text-white" />
            </div>
            SocialOptimizer
            <span className="font-normal text-muted-foreground ml-1">© 2026</span>
          </div>
          <div className="flex gap-6 text-xs">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms"   className="hover:text-foreground transition-colors">Terms</Link>
            <a href="mailto:hi@socialoptimizer.co" className="hover:text-foreground transition-colors">
              hi@socialoptimizer.co
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
