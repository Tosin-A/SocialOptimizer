# SocialOptimizer — Architecture & Deployment Guide

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼─────────────────────────────────────┐
│              NEXT.JS 15 APP (Vercel)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  Landing     │  │  Dashboard   │  │  API Routes            │  │
│  │  Auth pages  │  │  Analyze     │  │  /api/analyze          │  │
│  │  Terms       │  │  Generate    │  │  /api/generate         │  │
│  │  Pricing     │  │  Coach       │  │  /api/coach            │  │
│  │              │  │  Competitors │  │  /api/connect/[plat]   │  │
│  │              │  │  Discover    │  │  /api/competitors      │  │
│  │              │  │  Track       │  │  /api/competitors/[id]/│  │
│  │              │  │  Settings    │  │    ├── compare         │  │
│  │              │  │              │  │    └── refresh         │  │
│  │              │  │              │  │  /api/accounts         │  │
│  │              │  │              │  │  /api/billing          │  │
│  │              │  │              │  │  /api/webhooks/stripe  │  │
│  └──────────────┘  └──────────────┘  └────────────────────────┘  │
└────────────────┬────────────────┬───────────────────────────────┘
                 │                │
   ┌─────────────▼──┐    ┌────────▼─────────────-─┐
   │  SUPABASE      │    │  PYTHON FASTAPI        │
   │  (PostgreSQL)  │    │  (Railway)             │
   │  - Auth        │    │  - Whisper STT         │
   │  - RLS         │    │  - Hook detection      │
   │  - Storage     │    │  - Sentiment NLP       │
   │                │    │  - Profile scraping    │
   └────────────────┘    │    (httpx + JSON/HTML) │
                         └────────────┬───────────┘
                                      │
                            ┌─────────▼──────────┐
                            │  REDIS             │
                            │  (Upstash/Railway) │
                            │  - Job queuing     │
                            │  - Rate limiting   │
                            │  - Response cache  │
                            └────────────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 15 (App Router) | SSR, API routes, edge middleware |
| Language | TypeScript (strict) | Type safety across the entire codebase |
| UI | Tailwind CSS + shadcn/ui | Production-quality components, dark mode |
| Auth | Supabase Auth | OAuth + email, JWT, session management |
| Database | Supabase PostgreSQL | RLS, triggers, full-text search |
| AI/LLM | Anthropic Claude API | Content analysis, insight generation |
| Transcription | OpenAI Whisper API | Audio/video speech-to-text |
| NLP | Python: VADER, KeyBERT | Sentiment, keyword extraction |
| Web scraping | httpx + BeautifulSoup | HTTP-based public profile scraping (no browser) |
| Job queue | BullMQ + Redis | Async analysis jobs |
| Payments | Stripe | Checkout, subscriptions, webhooks |
| Client state | Zustand + React Query | Client state + server state |
| Validation | Zod | Request body validation on all API routes |
| Charts | Recharts | Dark-themed data visualization |
| Animations | Framer Motion | Smooth UI transitions (used sparingly) |

## Folder Structure

```
SocialOptimizer/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, signup)
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── layout.tsx            # Auth guard + sidebar layout
│   │   ├── dashboard/page.tsx    # Main dashboard
│   │   ├── analyze/page.tsx      # Analysis runner + report viewer
│   │   ├── competitors/page.tsx  # Competitor benchmarking + refresh
│   │   ├── coach/page.tsx        # AI content coaching (chat-based)
│   │   ├── discover/page.tsx     # Outliers, trends, saturation
│   │   ├── generate/page.tsx     # AI content generator
│   │   ├── track/page.tsx        # Experiments, win library
│   │   └── settings/page.tsx     # Account + billing settings
│   ├── (marketing)/              # Public marketing pages
│   │   ├── analyze/page.tsx      # Marketing landing for analysis
│   │   └── settings/page.tsx     # Public pricing/plan info
│   ├── api/                      # API routes
│   │   ├── accounts/route.ts     # List connected accounts + usage
│   │   ├── analyze/route.ts      # Start analysis job (POST)
│   │   │   └── status/[jobId]/   # Poll job status (GET)
│   │   ├── billing/              # Stripe checkout session creation
│   │   │   └── checkout/route.ts
│   │   ├── connect/[platform]/   # OAuth initiation
│   │   │   └── callback/         # OAuth callback handler
│   │   ├── competitors/route.ts  # Add/list competitors (GET, POST)
│   │   │   └── [id]/
│   │   │       ├── compare/      # Gap analysis (GET, POST)
│   │   │       └── refresh/      # Re-scrape profile data (POST)
│   │   ├── coach/                # Content coaching conversations
│   │   │   ├── conversations/    # CRUD for coach conversations
│   │   │   └── messages/         # Send/receive coach messages
│   │   ├── generate/route.ts     # Content generation
│   │   ├── reports/route.ts      # Analysis reports
│   │   └── webhooks/
│   │       └── stripe/route.ts   # Stripe webhook handler
│   ├── terms/page.tsx            # Terms of service
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Marketing landing page
│   └── globals.css
├── components/
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── AnalysisReport.tsx    # Full report viewer (tabs)
│   │   ├── AnalysisUsageBadge.tsx # Monthly usage indicator
│   │   ├── GrowthScoreCard.tsx   # Circular growth score
│   │   ├── ImprovementRoadmap.tsx
│   │   ├── MetricsGrid.tsx
│   │   ├── PlatformConnect.tsx   # OAuth connect cards
│   │   ├── QuickActions.tsx
│   │   ├── RecentReports.tsx
│   │   ├── UpgradeGate.tsx       # Feature lock with optional blurred teaser previews
│   │   └── UpgradeCard.tsx      # Free-to-paid nudge card for dashboard home
│   ├── landing/                  # Marketing page components
│   │   └── GradualBlur.tsx
│   ├── layout/                   # Sidebar, Header
│   ├── ui/                       # shadcn/ui primitives + StarBorder
│   └── providers/                # QueryProvider, ToastProvider
├── hooks/
│   └── use-feature-access.ts     # Client-side plan feature gate
├── lib/
│   ├── ai/claude.ts              # All Anthropic Claude API calls
│   ├── analysis/engine.ts        # Core analysis orchestrator
│   ├── data/landing.ts           # Landing page content + pricing tiers
│   ├── plans/feature-gate.ts     # Server-side plan feature access matrix
│   ├── platforms/                # Platform-specific API adapters
│   │   ├── tiktok.ts
│   │   ├── instagram.ts
│   │   ├── youtube.ts
│   │   └── index.ts              # OAuth URL factory
│   ├── stripe.ts                 # Stripe client, plan config, price mapping
│   ├── supabase/                 # Browser/server/service clients
│   └── utils.ts
├── python-service/               # FastAPI AI microservice
│   ├── main.py                   # FastAPI app + routes
│   ├── analyzers/
│   │   ├── content.py            # Hook, CTA, keyword analysis
│   │   └── sentiment.py          # VADER sentiment analysis
│   ├── scrapers/
│   │   └── public_scraper.py     # httpx-based public profile scraper
│   ├── services/
│   │   └── transcription.py      # Whisper audio transcription
│   ├── models/analysis.py        # Pydantic request/response models
│   ├── requirements.txt
│   └── Dockerfile
├── database/
│   ├── schema.sql                # Complete PostgreSQL schema
│   ├── migrations/               # Incremental schema changes
│   └── seed.sql                  # Niche benchmark data
├── types/index.ts                # Shared TypeScript types
├── middleware.ts                 # Auth middleware (route protection)
├── next.config.ts
├── tailwind.config.ts
└── .env.example
```

## Analysis Pipeline

```
User triggers analysis
        │
        ▼
POST /api/analyze
        │
        ├── Validate auth & account ownership
        ├── Check usage limits (analyses_used < analyses_limit)
        ├── Increment analyses_used
        ├── Create analysis_job record (status: pending)
        └── Return job_id immediately (202 Accepted)
                │
                ▼ (async background)
        Fetch posts from platform API
                │
                ▼
        Upsert posts to database
                │
                ▼
        Call Python service /analyze/posts
        ├── Transcribe audio (Whisper API)
        ├── Analyze hooks & CTAs
        └── Run sentiment analysis (VADER)
                │
                ▼
        Claude API — analyzeNicheAndThemes()
                │
                ▼
        Claude API — analyzeHashtags()
                │
                ▼
        Compute aggregate metrics (pure TypeScript)
        ├── Engagement score (vs platform benchmarks)
        ├── Consistency score (gap standard deviation)
        ├── Best posting days/hours
        └── Top performing formats
                │
                ▼
        Claude API — generateInsightsAndRoadmap()
        ├── Strengths (what you're doing well)
        ├── Weaknesses (what to fix)
        ├── Opportunities (growth gaps)
        └── Prioritized roadmap (8-10 actions)
                │
                ▼
        Save analysis_report to database
                │
                ▼
        Update job status → completed
```

## Competitor Scraping

The scraper uses **httpx** (HTTP requests) with JSON/HTML parsing — no headless browser required.

| Platform | Method | Data Source |
|----------|--------|-------------|
| TikTok | httpx GET | `__UNIVERSAL_DATA_FOR_REHYDRATION__` embedded JSON (3 fallback strategies: universal data → SIGI_STATE → meta tags) |
| YouTube | httpx GET | `ytInitialData` embedded JSON (handles both `c4TabbedHeaderRenderer` and `pageHeaderRenderer` formats). GDPR consent cookies bypass the consent wall. |
| Instagram | httpx GET | Meta tags (`og:description`, page title). Limited — Instagram blocks non-authenticated requests. |
| Facebook | — | Not implemented (returns empty profile) |

**Competitor lifecycle:**
1. `POST /api/competitors` — adds competitor, scrapes profile via Python service, upserts to DB
2. `POST /api/competitors/[id]/refresh` — re-scrapes profile data, updates DB row, returns fresh data to UI
3. `POST /api/competitors/[id]/compare` — computes gap analysis against user's latest report

## API Reference

### Authentication
All dashboard API routes require a valid Supabase session cookie.
Internal routes (Python service) use a shared secret via `X-Service-Secret` header.
Stripe webhooks are verified via `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`.

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/accounts` | List connected accounts + usage stats |
| GET | `/api/connect/[platform]` | Initiate OAuth flow |
| GET | `/api/connect/[platform]/callback` | OAuth callback |
| POST | `/api/analyze` | Start analysis job (returns 202 + job_id) |
| GET | `/api/analyze/status/[jobId]` | Poll job progress |
| GET | `/api/reports?id=` | Get specific report |
| POST | `/api/generate` | Generate content (hooks, captions, etc.) |
| GET | `/api/coach/conversations` | List coaching conversations |
| POST | `/api/coach/conversations` | Create new coaching conversation |
| DELETE | `/api/coach/conversations/[id]` | Delete a coaching conversation |
| POST | `/api/coach/messages` | Send message and get coaching response |
| POST | `/api/competitors` | Add competitor (scrapes profile) |
| GET | `/api/competitors` | List competitors |
| POST | `/api/competitors/[id]/refresh` | Re-scrape competitor profile data |
| POST | `/api/competitors/[id]/compare` | Run gap analysis |
| GET | `/api/competitors/[id]/compare` | Get saved comparison |
| POST | `/api/billing/checkout` | Create Stripe checkout session |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |

## Database Design Decisions

1. **Row-Level Security on every table** — Users can only access their own data, enforced at the DB level.
2. **Denormalized report scores** — Scores stored directly on the report for fast dashboard queries.
3. **JSONB for flexible structures** — Insights, roadmap, hashtag analysis stored as JSONB to avoid schema churn as AI outputs evolve.
4. **Engagement rate trigger** — Computed automatically on INSERT/UPDATE via DB trigger.
5. **Token encryption** — OAuth tokens should be encrypted with `pgcrypto` before storage in production.
6. **Usage tracking** — `analyses_used` and `analyses_limit` on the `users` table. Usage is preserved across plan upgrades (only the limit changes). Reset to 0 only on cancellation/downgrade to free.

## Deployment

### Frontend (Vercel)
```bash
vercel deploy --prod
# Set env vars in Vercel dashboard:
# ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, PYTHON_SERVICE_URL, PYTHON_SERVICE_SECRET,
# REDIS_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
# STRIPE_PRICE_ID_STARTER, STRIPE_PRICE_ID_PRO, STRIPE_PRICE_ID_AGENCY
```

### Python Service (Railway)
```bash
# Connect your GitHub repo in Railway dashboard
# Set Root Directory: python-service
# Build Command: pip install -r requirements.txt
# Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
#
# Set env vars in Railway dashboard:
# PYTHON_SERVICE_SECRET (must match Next.js app)
# PORT is set automatically by Railway
```

### Database (Supabase)
```bash
# Run schema
supabase db push
# Or paste schema.sql into Supabase SQL editor
# Then run migrations in order from database/migrations/
```

### Redis (Upstash)
- Create free Redis database at upstash.com
- Copy REDIS_URL to env vars

## Scalability Considerations

| Concern | Solution |
|---------|----------|
| Concurrent analyses | BullMQ job queue — workers process jobs async |
| AI API rate limits | Exponential backoff (tenacity), per-user rate limiting |
| Platform API quotas | Token refresh, webhook-based data sync where available |
| Transcription cost | Cache transcripts in `post_analyses.transcript` column |
| Database load | Supabase connection pooling (pgBouncer) + read replicas |
| Python service load | Horizontal scaling via Railway replicas |
| Memory (ML models) | Lazy-load models on first request, keep warm |
| Storage (media) | Supabase Storage for thumbnails, TTL cleanup job |

## Security Considerations

1. **OAuth state tokens** — HMAC-signed, stored in HttpOnly cookie, 10-minute TTL
2. **Platform tokens** — Store encrypted (`pgcrypto`), never expose to client
3. **Internal service auth** — Python service only accepts requests with matching `X-Service-Secret`
4. **RLS** — Every table has row-level security enabled
5. **Rate limiting** — API routes enforce per-user limits via Redis counters
6. **Input validation** — All API inputs validated with Zod schemas
7. **CSP headers** — Configured in `next.config.ts`
8. **Stripe webhook verification** — Raw body + signature verified before processing
9. **No token logging** — OAuth tokens never appear in console.log or error messages

## Monetization Architecture

| Plan | Analyses/mo | Platforms | Competitors | Content Gens | Coach Msgs/mo |
|------|------------|-----------|-------------|-------------|---------------|
| Free | 1 | 1 | 0 | 3 | 0 (locked) |
| Starter ($19) | 10 | 2 | 0 | 50 | 50 |
| Pro ($49) | 20 | 4 | 3 | unlimited | 200 |
| Agency ($199) | 50 | 10 | 50 | unlimited | unlimited |

Stripe webhooks handle plan changes:
- `checkout.session.completed` — updates `users.plan` and `users.analyses_limit` (preserves `analyses_used`)
- `customer.subscription.updated` — updates plan and limit if subscription is active
- `customer.subscription.deleted` — downgrades to free, resets usage
- `invoice.payment_failed` — logs failure for follow-up

Feature access is enforced at two levels:
- **Server-side**: `lib/plans/feature-gate.ts` defines the per-plan feature matrix
- **Client-side**: `hooks/use-feature-access.ts` + `UpgradeGate.tsx` component locks gated features with upgrade prompts

### Free-to-Paid Conversion

Gated features use blurred teaser previews instead of blank lock walls. `UpgradeGate` accepts an optional `teaser` prop — when provided, it renders mock preview content blurred (`blur-[6px]`) with a `bg-gradient-to-t` overlay and an upgrade CTA on top. Each gated page provides feature-specific teasers:

| Page | Teaser content |
|------|---------------|
| Discover | Mock outlier cards, trending hashtags, tab bar |
| Coach | Sample 3-message coaching conversation |
| Track | Mock experiment cards, score history bar chart |
| Competitors | Mock competitor profiles with metrics and hashtags |

Additional conversion touchpoints:
- **`UpgradeCard`** — shown on dashboard home for free users after first report. "You're leaving data on the table" with specific feature list.
- **`AnalysisUsageBadge`** — switches to amber upgrade prompt when 0 analyses remain (links to billing settings instead of analyze page).
