---
description: 
alwaysApply: true
---

# CLAUDE.md — SocialOptimizer

Internal engineering reference. Read this before touching any code.

---
 SocialOptimizer is a data-driven content analysis platform for creators and marketing agencies. It        
  connects to your social media accounts (TikTok, Instagram, YouTube, Facebook), pulls post-level        
  performance data, runs it through a multi-stage AI analysis pipeline, and returns specific, metric-backed 
  growth recommendations.

  It is not a scheduler, not a vanity dashboard, not a generic AI chatbot. It's an analysis engine.

  ---
  Core Output: The Analysis Report

  The central product artifact is the AnalysisReport — a structured document containing:

  - Growth scores — Quantified ratings across key dimensions (hook quality, engagement rate, posting
  consistency, content mix, etc.) displayed as circular progress indicators
  - Platform signals — Raw performance metrics pulled directly from connected accounts
  - Ranked fix list — A prioritized list of the highest-impact improvements, ordered by expected ROI
  - Posting time analysis — Optimal posting windows derived from actual engagement data, displayed as a time
   grid
  - Competitor comparison — Gap analysis against scraped competitor profiles showing where the user
  underperforms and outperforms
  - AI coaching — An interactive chat interface (Claude-powered) that answers follow-up questions grounded
  in the user's actual data

  Every insight references a specific metric (e.g., "your CTA usage rate of 23% is below the platform median
   of 61%") and states a concrete recommendation (e.g., "post 3x per week on Tuesday, Thursday, and
  Saturday"). No motivational filler. No vague advice.

  ---
  How It Works

  1. Connect accounts — OAuth integration with TikTok (primary focus), Instagram, YouTube, and Facebook
  2. Data ingestion — Post-level metrics are fetched via platform APIs and stored in PostgreSQL (Supabase)
  3. Analysis pipeline — A multi-stage engine (lib/analysis/engine.ts) orchestrates:
    - Metric aggregation and scoring
    - NLP/sentiment analysis (Python service using VADER)
    - Video transcript analysis (Whisper via Python service)
    - Competitor scraping and gap analysis (httpx-based, no headless browser)
    - Claude AI synthesis — takes all structured data and produces the final scored report with
  recommendations
  4. Async processing — Analyses take 15–30 seconds, so they run through BullMQ/Redis. The API returns a
  job_id immediately (202 Accepted), and the client polls for completion.
  5. Report delivery — Structured JSON rendered as an interactive dashboard with charts (Recharts), scores,
  and actionable lists

  ---
  Target Users

  ┌───────────────────────────┬─────────────────────────────────────────────────────────────────────────┐
  │          Segment          │                                Use Case                                 │
  ├───────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ Serious individual        │ Treat their channel as a business; want data-backed decisions, not      │
  │ creators                  │ motivation                                                              │
  ├───────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ Marketing agencies        │ Run analysis across multiple client accounts; need structured,          │
  │                           │ shareable reports                                                       │
  ├───────────────────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ Growth-focused operators  │ Want specific metrics and deltas, not "post more consistently"          │
  └───────────────────────────┴─────────────────────────────────────────────────────────────────────────┘

  ---
  Monetization

  Four tiers via Stripe subscriptions:

  ┌─────────┬─────────┬─────────────┬───────────┬─────────────┬─────────────────────┬───────────────────┐
  │  Plan   │  Price  │ Analyses/mo │ Platforms │ Competitors │ Content Generations │ AI Coach Messages │
  ├─────────┼─────────┼─────────────┼───────────┼─────────────┼─────────────────────┼───────────────────┤
  │ Free    │ $0      │ 1           │ 1         │ 0           │ 3                   │ Locked            │
  ├─────────┼─────────┼─────────────┼───────────┼─────────────┼─────────────────────┼───────────────────┤
  │ Starter │ $19/mo  │ 10          │ 2         │ 0           │ 50                  │ 50/mo             │
  ├─────────┼─────────┼─────────────┼───────────┼─────────────┼─────────────────────┼───────────────────┤
  │ Pro     │ $49/mo  │ 20          │ 4         │ 3           │ Unlimited           │ 200/mo            │
  ├─────────┼─────────┼─────────────┼───────────┼─────────────┼─────────────────────┼───────────────────┤
  │ Agency  │ $199/mo │ 50          │ 10        │ 50          │ Unlimited           │ Unlimited         │
  └─────────┴─────────┴─────────────┴───────────┴─────────────┴─────────────────────┴───────────────────┘

  Gated features show blurred teaser previews (not blank lock walls) so free users can see exactly what
  they'd unlock. A share-based growth loop lets users earn 3 bonus scans per shared report.

  ---
  Tech Stack Summary

  - Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts, Framer Motion
  - Backend: Next.js API routes, BullMQ + Redis job queue, Supabase (PostgreSQL + Auth + RLS)
  - AI: Anthropic Claude API (Opus model) for analysis synthesis, coaching, and content generation
  - Python microservice: FastAPI — handles NLP (VADER sentiment), transcription (Whisper), and httpx-based
  competitor scraping
  - Payments: Stripe (checkout, subscriptions, webhooks)
  - Deployment: Vercel (frontend), Railway (Python service), Supabase (DB), Upstash (Redis)

  ---
  Design Philosophy

  - Dark, professional UI — neutral dark background, deep blue accents, Inter font. Feels like a tool a
  professional paid for, not a marketing page.
  - Information-dense — No gratuitous whitespace or decorative illustrations. Scores, percentages, and
  deltas front and center.
  - Confident product voice — If the hook score is 34/100, it says that. Error messages are direct and
  specific, never "Oops! Something went wrong."
  - Analysis product, not a social media tool — No scheduling, no content calendar, no vanity metrics
  dashboard. Every feature traces back to the core loop: connect → analyze → improve.


## 1. Project Overview

**SocialOptimizer** is a web application that connects to a user's TikTok, Instagram, YouTube, and Facebook accounts, fetches post-level performance data, runs it through a multi-stage analysis pipeline, and returns specific, metric-backed growth recommendations.

The product is not a social media scheduler, a vanity dashboard, or a generic AI chatbot. It is an analysis engine. The output is an `AnalysisReport` — a structured document with scores, insights, a competitor comparison, and a prioritized improvement roadmap.

**Current launch focus:** TikTok-first. Other platforms are supported but TikTok is the primary integration.

**Target users:**
- Serious individual creators who treat their channel as a business
- Marketing agencies running analysis on multiple client accounts
- Growth-focused operators who want data, not motivation

**Core value proposition:** Replace guesswork with data. Every recommendation traces back to a specific metric.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| UI components | shadcn/ui (Radix UI primitives) + Tailwind CSS |
| Auth + DB | Supabase (PostgreSQL, RLS, Auth, Storage) |
| AI/LLM | Anthropic Claude API (`@anthropic-ai/sdk`) |
| Python service | FastAPI — NLP, sentiment, transcription, scraping |
| Scraping | httpx + BeautifulSoup (HTTP-based, no headless browser) |
| Payments | Stripe (checkout, subscriptions, webhooks) |
| Job queue | BullMQ + Redis |
| Client state | Zustand |
| Server state | TanStack React Query |
| Validation | Zod |
| Charts | Recharts |
| Animations | Framer Motion (use sparingly) |

Key files:
- `lib/ai/claude.ts` — all Anthropic API calls live here
- `lib/analysis/engine.ts` — analysis orchestration
- `lib/platforms/` — per-platform OAuth and API adapters
- `lib/stripe.ts` — Stripe client, plan config, price mapping
- `lib/plans/feature-gate.ts` — per-plan feature access matrix
- `types/index.ts` — all shared TypeScript interfaces
- `app/api/` — Next.js API routes
- `app/api/webhooks/stripe/route.ts` — Stripe webhook handler
- `python-service/` — FastAPI microservice
- `python-service/scrapers/public_scraper.py` — httpx-based profile scraper
- `database/schema.sql` — full PostgreSQL schema

---

## 3. Engineering Philosophy

**Performance first.** API routes return immediately with a `job_id` (202 Accepted). Heavy work runs async through BullMQ. Never block a response on Claude API calls or platform fetches.

**Security is not optional.** OAuth tokens handle real user accounts. Treat them accordingly. See section 6.

**Clear tradeoffs over overengineering.** The job queue is async because analyses take 15–30 seconds. That's the reason — not because queues are architecturally elegant. Add complexity only when there's a concrete, current reason for it.

**Don't abstract until it hurts twice.** Three similar handlers is not a reason to build a factory. If a pattern repeats across four platforms and the logic is genuinely identical, extract it. Otherwise leave it inline.

**The Python service exists for a reason.** Whisper transcription, VADER sentiment, and httpx scraping are grouped in the Python service because they depend on Python-specific libraries. Don't move Python logic into TypeScript unless there's a measurable reason to.

---

## 4. Coding Standards

### TypeScript

- All types live in `types/index.ts`. Do not define types locally in components or API routes unless they are truly one-off and will never be shared.
- Use explicit return types on exported functions.
- No `any`. Use `unknown` and narrow it, or define the correct type.
- Prefer `interface` for object shapes, `type` for unions and aliases.

```ts
// correct
export async function analyzeHashtags(
  hashtags: string[],
  niche: string,
  platform: Platform
): Promise<HashtagAnalysis[]>

// wrong
export async function analyzeHashtags(hashtags, niche, platform)
```

### Components

- One component per file. File name = component name.
- Dashboard-specific components go in `components/dashboard/`. Layout primitives go in `components/layout/`. Radix/shadcn primitives go in `components/ui/`.
- Keep components focused. If a component is doing data fetching AND rendering a chart AND handling form state, split it.
- Props interfaces are defined inline at the top of the file, not in `types/index.ts` (those are for domain types, not UI props).

### API Routes

- All routes live under `app/api/`.
- Validate every request body with a Zod schema before touching it.
- Return `{ data: T | null, error: string | null }` — the `ApiResponse<T>` type from `types/index.ts`.
- Auth check goes first, always. Use `createServerClient` from `lib/supabase/server.ts`.
- HTTP status codes should be meaningful: 202 for async jobs, 400 for validation errors, 401 for auth, 402 for usage limit exceeded, 403 for plan limits, 502 for Python service errors, 500 for unexpected.

### Naming

- Files: `camelCase.ts` for utilities/libs, `PascalCase.tsx` for components
- Functions: `camelCase`, verb-first (`analyzeHashtags`, `generateContent`, `fetchPosts`)
- Constants: `SCREAMING_SNAKE_CASE`
- Database columns: `snake_case` (match Supabase schema exactly)
- Types/interfaces: `PascalCase`

---

## 5. AI & Analysis Principles

All Claude API calls live in `lib/ai/claude.ts`. Do not call the Anthropic SDK from anywhere else.

### Insight quality rules

Every insight returned by Claude must:
- Reference a specific metric from the analysis data (e.g., "your CTA usage rate of 23% is below the platform median of 61%")
- State a concrete recommendation, not a direction ("post 3x per week on Tuesday, Thursday, and Saturday" not "post more consistently")
- Quantify the expected impact where possible ("expect 15–25% improvement in engagement rate within 4 weeks")
- Explain the mechanism (why does this work, not just what to do)

### What the prompts must never produce

- "Keep up the great work!" — no motivational filler
- "Consider experimenting with different content types" — not specific enough
- "Engagement is important for growth" — obvious, useless
- Hedging phrases: "you might want to", "it could be helpful to", "perhaps consider"

The `ANALYSIS_SYSTEM_PROMPT` and `GENERATION_SYSTEM_PROMPT` in `lib/ai/claude.ts` enforce this. Do not soften them.

### JSON output discipline

Claude is always prompted to return structured JSON. The `extractJSON()` utility in `lib/ai/claude.ts` strips markdown code blocks. If you add a new Claude call:
1. Define the output type in `types/index.ts` first
2. Write the schema explicitly in the prompt
3. Parse with `JSON.parse(extractJSON(text))` and validate the shape before returning

Never return raw Claude text to the client. The client always receives typed, structured data.

### Model

The current model is `claude-opus-4-6`. Don't downgrade to Haiku or Sonnet for analysis tasks — the output quality difference is measurable. If cost is a concern, cache aggressively (transcript column, report reuse) before changing the model.

---

## 6. Security & Data Handling

### OAuth tokens

- Never log access tokens or refresh tokens. Not in `console.log`, not in error messages, not in database logs.
- Tokens are stored in the `connected_accounts` table. In production they must be encrypted with `pgcrypto` (documented in `ARCHITECTURE.md`). Enforce this before any production deployment.
- Never return token values to the client in API responses. The client only needs account metadata (`username`, `followers`, `platform`).
- OAuth state parameters are HMAC-signed with a 10-minute TTL. Do not bypass this check.

### Request validation

- Every API route that accepts user input validates with a Zod schema before any database or Claude call.
- Platform identifiers coming from URL params (`/api/connect/[platform]`) must be validated against the `Platform` union type before use.
- Never concatenate user input into SQL. Use Supabase's parameterized query API.

### Environment variables

- All secrets are in `.env.local` (local) or the Vercel/Railway dashboard (production).
- Required vars: `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PYTHON_SERVICE_URL`, `PYTHON_SERVICE_SECRET`, `REDIS_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_STARTER`, `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_AGENCY`
- Internal service auth: Python FastAPI only accepts requests with a matching `X-Service-Secret` header. This is set from `PYTHON_SERVICE_SECRET`. Do not remove this check.
- Python service loads its `.env` via `python-dotenv` on startup. The `.env` file in `python-service/` is gitignored.
- Never commit `.env.local` or `python-service/.env`. Both are gitignored.

### Stripe webhooks

- Webhook signature is verified with `stripe.webhooks.constructEvent()` before processing any event.
- Raw body (`req.text()`) is required for signature verification — do not parse as JSON first.
- Plan upgrades preserve `analyses_used` (usage carries over). Only cancellation/downgrade resets usage to 0.

### Least privilege

- Client-side Supabase uses the anon key. Service-role key is server-only, used in API routes for admin operations.
- RLS is enabled on every table. Do not use the service-role key as a shortcut to bypass RLS during development.
- The Python service has no database access. Data flows: Next.js fetches from DB → sends to Python service → Python returns analysis → Next.js writes results to DB.

---

## 7. Design System

### Visual rules

- Background: dark neutral (`--background: 220 14% 6%` → ~#0d0f14)
- Primary accent: deep blue (`blue-500: #3b82f6`, `blue-600: #2563eb`), aliased as `brand-*`
- Text: `slate-100` (primary), `slate-400` (secondary/muted)
- Font: Inter (already set in globals)
- Cards: solid `bg-card` with `border-border` — no glassmorphism, no backdrop-blur
- Border: `border-border` (CSS custom property, ~16% lightness)
- Destructive: `red-500`
- Success: `emerald-500`

### Custom UI components

- `UpgradeGate` (`components/dashboard/UpgradeGate.tsx`) — plan-gated feature wrapper. Supports a `teaser` prop for blurred preview content with gradient overlay + upgrade CTA. Without `teaser`, falls back to a simple lock icon card.
- `UpgradeCard` (`components/dashboard/UpgradeCard.tsx`) — "You're leaving data on the table" nudge card for free users on the dashboard home.

### UI philosophy

The UI is a dashboard, not a marketing page. Every screen should feel like a tool a professional paid for. Information density matters — don't pad things out with whitespace and icons to make a sparse screen look "designed."

Avoid:
- Gradient hero sections
- Animated blob backgrounds
- "Your growth journey starts here" type copy in the UI
- Modal confirmations for low-stakes actions
- Skeleton loaders that take longer to understand than the actual content
- Empty states with illustration packs

Charts use Recharts. Keep them dark-themed, minimal axes, no chart junk. Scores are circular progress indicators (see `GrowthScoreCard.tsx`).

Framer Motion is installed. Use it for meaningful transitions (page-level, modal enter/exit). Do not add `animate` props to every div.

---

## 8. Monetization & Plans

Plans are defined in `lib/stripe.ts` and enforced via `lib/plans/feature-gate.ts`.

| Plan | Analyses/mo | Platforms | Competitors | Content Gens | Coach Msgs/mo |
|------|------------|-----------|-------------|-------------|---------------|
| Free | 1 | 1 | 0 | 3 | 0 (locked) |
| Starter ($19) | 10 | 2 | 0 | 50 | 50 |
| Pro ($49) | 20 | 4 | 3 | unlimited | 200 |
| Agency ($199) | 50 | 10 | 50 | unlimited | unlimited |

**Usage tracking:** `analyses_used` and `analyses_limit` columns on the `users` table. Incremented in `/api/analyze` before creating the job. Checked with `analyses_used >= analyses_limit` (returns 402).

**Plan upgrades preserve usage.** When a user upgrades, only `analyses_limit` changes — `analyses_used` carries over so they don't lose their count. Usage resets to 0 only on cancellation/downgrade to free.

**Feature gating:** Two layers:
- Server-side: `lib/plans/feature-gate.ts` (`canAccess(plan, feature)`)
- Client-side: `hooks/use-feature-access.ts` + `components/dashboard/UpgradeGate.tsx`

**Free-to-paid conversion:** Gated features show blurred teaser previews instead of blank lock walls. `UpgradeGate` accepts an optional `teaser` prop (ReactNode) — when provided, it renders the teaser blurred with a gradient overlay and upgrade CTA on top. Each gated page (Discover, Coach, Track, Competitors) provides feature-specific mock content as teasers so free users see what they'd unlock.

Additional conversion components:
- `components/dashboard/UpgradeCard.tsx` — "What you're missing" card shown on the dashboard home for free users after their first report. Lists specific features and limits they'd gain by upgrading.
- `components/dashboard/AnalysisUsageBadge.tsx` — Shows amber-colored upgrade prompt when the user has 0 analyses left (especially prominent for free users).

---

## 9. Competitor Scraping

The scraper (`python-service/scrapers/public_scraper.py`) uses **httpx** with JSON/HTML parsing. No headless browser (Playwright was removed).

| Platform | Data Source | Reliability |
|----------|-------------|-------------|
| TikTok | `__UNIVERSAL_DATA_FOR_REHYDRATION__` embedded JSON | High — 3 fallback strategies |
| YouTube | `ytInitialData` embedded JSON + GDPR consent cookies | High — handles both old and new page formats |
| Instagram | Meta tags (`og:description`, page title) | Low — Instagram blocks non-authenticated requests |
| Facebook | Not implemented | Returns empty profile |

**Important scraper details:**
- HTTP headers must be minimal — extra headers like `Accept-Encoding: br` cause platforms to return garbled/incomplete responses.
- YouTube requires GDPR consent cookies (`SOCS`, `CONSENT`) to bypass the consent wall.
- The Python service needs `PYTHON_SERVICE_SECRET` in its environment to accept requests. Locally this is loaded from `python-service/.env` via `python-dotenv`.

**Competitor endpoints:**
- `POST /api/competitors` — add competitor (scrapes on creation)
- `POST /api/competitors/[id]/refresh` — re-scrape profile data, update DB, return fresh data
- `POST /api/competitors/[id]/compare` — run gap analysis against user's latest report

---

## 10. What to Avoid

### In code

- Do not add new npm packages without a concrete reason. Check if the existing stack can handle it first (Zod for validation, date-fns for dates, Radix for UI, etc.)
- Do not rewrite stable components. `AnalysisReport.tsx`, `MetricsGrid.tsx`, `GrowthScoreCard.tsx` work. Touch them only to fix bugs or add required features.
- Do not move logic into `useEffect` to avoid thinking about server components. Use React Query, server actions, or API routes correctly.
- Do not use `any` to unblock a TypeScript error. Fix the type.
- Do not add `console.log` to production code paths. Use structured error logging or remove after debugging.

### In product decisions

- Do not add features that make the product feel like a general-purpose social media tool. SocialOptimizer is an analysis product.
- Do not generate generic content suggestions ("post more videos!") anywhere in the UI or AI output.
- Do not build config options for things that should just work correctly by default.

### In architecture

- Do not move analysis work into API route handlers that run synchronously. Long operations go through BullMQ.
- Do not bypass RLS with service-role key shortcuts during development and forget to revert.
- Do not add a new microservice unless the workload is genuinely incompatible with the existing Python service.
- Do not add Playwright or headless browser dependencies. The scraper uses httpx for a reason — it's lighter, faster, and doesn't need browser system libraries.

---

## 11. Product Voice

When writing UI copy, error messages, empty states, or anything user-facing:

- Direct. Say what happened. "Analysis failed — YouTube rate limit exceeded. Try again in 2 hours." Not "Oops! Something went wrong."
- Slightly technical. Users are creators who care about metrics. Don't dumb it down.
- No marketing language inside the product. "Unlock your growth potential" belongs on a landing page, not in a dashboard component.
- Confident. If the data says the hook score is 34/100, say that. Don't soften it to "there's room to improve here."
- Specific. Scores, percentages, deltas. Not "your engagement is low" — "your engagement rate of 1.2% is 2.8x below the fitness niche median of 3.4%."

---

## 12. Development Workflow

```bash
# Local dev — run both services
npm run dev                                          # Next.js on :3000
cd python-service && source venv/bin/activate && uvicorn main:app --reload --port 8000  # FastAPI on :8000

# Type checking
npm run type-check

# Database types (after schema changes)
npm run db:generate

# Bundle analysis
npm run analyze
```

### Deployment

- **Frontend:** Vercel (auto-deploys from `main` branch)
- **Python service:** Railway (root directory: `python-service`, start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`)
- **Database:** Supabase (run `schema.sql` + migrations in order)
- **Redis:** Upstash

Before opening a PR:
1. `npm run type-check` — must pass with zero errors
2. `npm run lint` — must pass
3. Verify no tokens or secrets appear in any changed file
4. Verify new API routes validate input with Zod and check auth before any business logic
