# SocialOptimizer — Architecture & Deployment Guide

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼─────────────────────────────────────┐
│              NEXT.JS 15 APP (Vercel Edge)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  Landing     │  │  Dashboard   │  │  API Routes            │  │
│  │  Auth pages  │  │  Analyze     │  │  /api/analyze          │  │
│  │              │  │  Generate    │  │  /api/generate         │  │
│  │              │  │  Competitors │  │  /api/connect/[plat]   │  │
│  └──────────────┘  └──────────────┘  │  /api/competitors      │  │
│                                       │  /api/accounts         │  │
│                                       └────────────────────────┘  │
└────────────────┬─────────────────┬──────────────────────────────┘
                 │                 │
   ┌─────────────▼──┐    ┌─────────▼──────────┐
   │  SUPABASE      │    │  PYTHON FASTAPI     │
   │  (PostgreSQL)  │    │  (Railway/Fly.io)   │
   │  - Auth        │    │  - Whisper STT      │
   │  - RLS         │    │  - Hook detection   │
   │  - Storage     │    │  - Sentiment NLP    │
   │  - Realtime    │    │  - Public scraping  │
   └────────────────┘    └──────────┬──────────┘
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
| Language | TypeScript | Type safety across the entire codebase |
| UI | Tailwind CSS + shadcn/ui | Production-quality components, dark mode |
| Auth | Supabase Auth | OAuth + email, JWT, session management |
| Database | Supabase PostgreSQL | RLS, triggers, full-text search |
| AI/LLM | Anthropic Claude API | Content analysis, insight generation |
| Transcription | OpenAI Whisper | Audio/video speech-to-text |
| NLP | Python: VADER, KeyBERT | Sentiment, keyword extraction |
| Web scraping | Playwright | Headless browser for public profile data |
| Job queue | BullMQ + Redis | Async analysis jobs |
| State | Zustand + React Query | Client state + server state |
| Animations | Framer Motion | Smooth UI transitions |

## Folder Structure

```
SocialOptimizer/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, signup)
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── layout.tsx            # Auth guard + sidebar layout
│   │   ├── dashboard/page.tsx    # Main dashboard
│   │   ├── analyze/page.tsx      # Analysis runner + report viewer
│   │   ├── competitors/page.tsx  # Competitor benchmarking
│   │   ├── generate/page.tsx     # AI content generator
│   │   └── settings/page.tsx     # Account + billing settings
│   ├── api/                      # API routes
│   │   ├── accounts/route.ts     # List connected accounts
│   │   ├── analyze/route.ts      # Start analysis job (POST)
│   │   │   └── status/[jobId]/   # Poll job status (GET)
│   │   ├── connect/[platform]/   # OAuth initiation
│   │   │   └── callback/         # OAuth callback handler
│   │   ├── competitors/route.ts  # Add/list competitors
│   │   ├── generate/route.ts     # Content generation
│   │   └── reports/route.ts      # Analysis reports
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Marketing landing page
│   └── globals.css
├── components/
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── AnalysisReport.tsx    # Full report viewer (tabs)
│   │   ├── GrowthScoreCard.tsx   # Circular growth score
│   │   ├── ImprovementRoadmap.tsx
│   │   ├── MetricsGrid.tsx
│   │   ├── PlatformConnect.tsx   # OAuth connect cards
│   │   ├── QuickActions.tsx
│   │   └── RecentReports.tsx
│   ├── layout/                   # Sidebar, Header
│   ├── ui/                       # shadcn/ui primitives
│   └── providers/                # QueryProvider, ToastProvider
├── lib/
│   ├── ai/claude.ts              # Anthropic Claude API calls
│   ├── analysis/engine.ts        # Core analysis orchestrator
│   ├── platforms/                # Platform-specific API adapters
│   │   ├── tiktok.ts
│   │   ├── instagram.ts
│   │   ├── youtube.ts
│   │   └── index.ts              # OAuth URL factory
│   ├── supabase/                 # Browser/server/service clients
│   └── utils.ts
├── python-service/               # FastAPI AI microservice
│   ├── main.py                   # FastAPI app + routes
│   ├── analyzers/
│   │   ├── content.py            # Hook, CTA, keyword analysis
│   │   └── sentiment.py          # VADER sentiment analysis
│   ├── scrapers/
│   │   └── public_scraper.py     # Playwright public profile scraper
│   ├── services/
│   │   └── transcription.py      # Whisper audio transcription
│   ├── models/analysis.py        # Pydantic request/response models
│   ├── requirements.txt
│   └── Dockerfile
├── database/
│   ├── schema.sql                # Complete PostgreSQL schema
│   └── seed.sql                  # Niche benchmark data
├── types/index.ts                # Shared TypeScript types
├── middleware.ts                 # Auth middleware (route protection)
├── docker-compose.yml
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
        ├── Check usage limits (free plan gate)
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
        ├── Transcribe audio (Whisper)
        ├── Analyze hooks & CTAs
        └── Run sentiment analysis
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

## API Reference

### Authentication
All dashboard API routes require a valid Supabase session cookie.
Internal routes (Python service) use a shared HMAC secret via `X-Service-Secret` header.

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/accounts` | List connected accounts |
| GET | `/api/connect/[platform]` | Initiate OAuth flow |
| GET | `/api/connect/[platform]/callback` | OAuth callback |
| POST | `/api/analyze` | Start analysis job |
| GET | `/api/analyze/status/[jobId]` | Poll job progress |
| GET | `/api/reports?id=` | Get specific report |
| POST | `/api/generate` | Generate content (hooks, captions, etc.) |
| POST | `/api/competitors` | Add competitor |
| GET | `/api/competitors` | List competitors |

## Database Design Decisions

1. **Row-Level Security on every table** — Users can only access their own data, enforced at the DB level.
2. **Denormalized report scores** — Scores stored directly on the report for fast dashboard queries.
3. **JSONB for flexible structures** — Insights, roadmap, hashtag analysis stored as JSONB to avoid schema churn as AI outputs evolve.
4. **Engagement rate trigger** — Computed automatically on INSERT/UPDATE via DB trigger.
5. **Token encryption** — OAuth tokens should be encrypted with `pgcrypto` before storage in production.

## Deployment

### Frontend (Vercel)
```bash
vercel deploy --prod
# Set env vars in Vercel dashboard
```

### Python Service (Railway)
```bash
railway login
railway link
railway up --service python-service
# Set env vars in Railway dashboard
```

### Database (Supabase)
```bash
# Run schema
supabase db push
# Or paste schema.sql into Supabase SQL editor
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
| Python service load | Horizontal scaling via Railway/Fly.io replicas |
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

## Monetization Architecture

| Plan | Analyses/mo | Platforms | Competitors | Content Gens |
|------|------------|-----------|-------------|-------------|
| Free | 3 | 1 | 0 | 20 |
| Starter ($29) | 20 | 2 | 5 | unlimited |
| Pro ($79) | unlimited | 4 | 20 | unlimited |
| Agency ($199) | unlimited | 10 | 50 | unlimited |

Stripe webhooks update the `users.plan` and `users.analyses_limit` columns.
