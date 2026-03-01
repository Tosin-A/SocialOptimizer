export const SIGNALS = [
  { name: "Hook quality",        score: 3.2, desc: "How well the opening earns continued reading" },
  { name: "Hashtag efficiency",  score: 4.8, desc: "Tag specificity vs. competition volume" },
  { name: "CTA placement",       score: 2.1, desc: "Ask visibility relative to caption drop-off" },
  { name: "Posting cadence",     score: 8.3, desc: "Frequency and timing vs. audience activity" },
  { name: "Content consistency", score: 6.7, desc: "Format and topic variance across 90 days" },
];

export const FIXES = [
  { rank: "01", label: "Rewrite caption openers",  impact: "high",   detail: "All 48 posts start with context, not a hook" },
  { rank: "02", label: "Cut hashtags to 6 niche",  impact: "high",   detail: "Currently 22/post — drop #food, #recipe" },
  { rank: "03", label: "Add CTA before the fold",  impact: "medium", detail: "Missing or buried in 80% of captions" },
  { rank: "04", label: "Shift to 6–8 pm window",   impact: "medium", detail: "Audience peak is 3h after current timing" },
];

export const PLATFORMS = [
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

export const FINDINGS = [
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

export const CASE_DATA = [1.1, 1.3, 1.2, 1.0, 1.4, 1.2, 2.1, 2.8, 3.3, 3.9, 4.3, 4.8];

export const CASE_CHANGES = [
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

export const FAQ = [
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

export const TESTIMONIALS = [
  {
    quote: "I cut my hashtag count from 28 to 6. My reach tripled in two weeks. The report was blunt about what wasn't working — that's exactly what I needed.",
    name: "Mariana T.",
    handle: "@mariana.cooks",
    platform: "Instagram",
    followers: "84K",
  },
  {
    quote: "The hook scoring made me realize I was opening 90% of my videos with context instead of a pattern interrupt. Tested one rewrite, got 3× the completion rate.",
    name: "Derek S.",
    handle: "@derek.finance",
    platform: "TikTok",
    followers: "210K",
  },
  {
    quote: "I've tried five analytics tools. This is the first one that told me the specific thing to fix, not just charts. The roadmap was actually actionable.",
    name: "Priya M.",
    handle: "@priyalifts",
    platform: "Instagram",
    followers: "41K",
  },
  {
    quote: "The competitor gap analysis showed me exactly which hashtags my top competitor was using that I wasn't. Added them, saw reach improve within days.",
    name: "James K.",
    handle: "@jktravel",
    platform: "YouTube",
    followers: "127K",
  },
  {
    quote: "My growth score went from 38 to 71 in six weeks. I just followed the roadmap in order. Nothing clever, just executed the list.",
    name: "Sofia R.",
    handle: "@sofia.wellness",
    platform: "TikTok",
    followers: "56K",
  },
  {
    quote: "The posting cadence insight was the biggest surprise — I was posting too frequently. Dropped from daily to 4×/week and engagement went up immediately.",
    name: "Chris A.",
    handle: "@chrisbuilds",
    platform: "YouTube",
    followers: "93K",
  },
];

export const LIMITS = [
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

export const TIERS = [
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
    name:    "Starter",
    price:   "$29",
    cadence: "/month",
    note:    "For creators ready to take their growth seriously",
    features: [
      "20 analyses / month",
      "2 connected platforms",
      "5 competitor profiles",
      "Content generation",
      "Full growth score breakdown",
    ],
    missing: ["Unlimited analyses", "White-label reports"],
    cta:    "Get Starter",
    href:   "/signup?plan=starter",
    accent: false,
  },
  {
    name:    "Pro",
    price:   "$79",
    cadence: "/month",
    note:    "For creators who want to act on the data",
    features: [
      "Unlimited analyses",
      "4 platforms simultaneously",
      "20 competitor profiles",
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
    price:   "$199",
    cadence: "/month",
    note:    "For teams managing multiple creator accounts",
    features: [
      "Unlimited analyses",
      "Up to 10 accounts",
      "50 competitor profiles",
      "White-label PDF reports",
      "API access",
      "Priority support",
    ],
    missing: [],
    cta:    "Get Agency",
    href:   "/signup?plan=agency",
    accent: false,
  },
];

export const STATS = [
  { value: "2,000+",   label: "accounts analyzed" },
  { value: "4",        label: "platforms covered" },
  { value: "90 days",  label: "data window" },
  { value: "5",        label: "growth signals scored" },
];
