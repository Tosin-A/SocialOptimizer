# CLAUDE.md — SocialOptimizer

Internal engineering reference. Read this before touching any code.

---

## 1. Project Overview

**SocialOptimizer** is a web application that connects to a user's TikTok, Instagram, YouTube, and Facebook accounts, fetches post-level performance data, runs it through a multi-stage analysis pipeline, and returns specific, metric-backed growth recommendations.

The product is not a social media scheduler, a vanity dashboard, or a generic AI chatbot. It is an analysis engine. The output is an `AnalysisReport` — a structured document with scores, insights, a competitor comparison, and a prioritized improvement roadmap.

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
- `types/index.ts` — all shared TypeScript interfaces
- `app/api/` — Next.js API routes
- `python-service/` — FastAPI microservice
- `database/schema.sql` — full PostgreSQL schema

---

## 3. Engineering Philosophy

**Performance first.** API routes return immediately with a `job_id` (202 Accepted). Heavy work runs async through BullMQ. Never block a response on Claude API calls or platform fetches.

**Security is not optional.** OAuth tokens handle real user accounts. Treat them accordingly. See section 6.

**Clear tradeoffs over overengineering.** The job queue is async because analyses take 15–30 seconds. That's the reason — not because queues are architecturally elegant. Add complexity only when there's a concrete, current reason for it.

**Don't abstract until it hurts twice.** Three similar handlers is not a reason to build a factory. If a pattern repeats across four platforms and the logic is genuinely identical, extract it. Otherwise leave it inline.

**The Python service exists for a reason.** Whisper transcription, VADER sentiment, and Playwright scraping are not appropriate in a Next.js edge function. Don't move Python logic into TypeScript unless there's a measurable reason to.

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
- HTTP status codes should be meaningful: 202 for async jobs, 400 for validation errors, 401 for auth, 403 for plan limits, 500 for unexpected.

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
- Required vars: `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PYTHON_SERVICE_URL`, `PYTHON_SERVICE_SECRET`, `REDIS_URL`
- Internal service auth: Python FastAPI only accepts requests with a matching `X-Service-Secret` header. This is set from `PYTHON_SERVICE_SECRET`. Do not remove this check.
- Never commit `.env.local`. It is gitignored.

### Least privilege

- Client-side Supabase uses the anon key. Service-role key is server-only, used in API routes for admin operations.
- RLS is enabled on every table. Do not use the service-role key as a shortcut to bypass RLS during development.
- The Python service has no database access. Data flows: Next.js fetches from DB → sends to Python service → Python returns analysis → Next.js writes results to DB.

---

## 7. Design System

### Visual rules

- Background: dark slate (`slate-900`, `slate-950`)
- Accents: indigo/blue (`indigo-500`, `indigo-600`)
- Text: `slate-100` (primary), `slate-400` (secondary/muted)
- Font: Inter (already set in globals)
- Border: `slate-700` / `slate-800`
- Destructive: `red-500`
- Success: `emerald-500`

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

## 8. What to Avoid

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

---

## 9. Product Voice

When writing UI copy, error messages, empty states, or anything user-facing:

- Direct. Say what happened. "Analysis failed — YouTube rate limit exceeded. Try again in 2 hours." Not "Oops! Something went wrong."
- Slightly technical. Users are creators who care about metrics. Don't dumb it down.
- No marketing language inside the product. "Unlock your growth potential" belongs on a landing page, not in a dashboard component.
- Confident. If the data says the hook score is 34/100, say that. Don't soften it to "there's room to improve here."
- Specific. Scores, percentages, deltas. Not "your engagement is low" — "your engagement rate of 1.2% is 2.8x below the fitness niche median of 3.4%."

---

## 10. Development Workflow

```bash
# Local dev
npm run dev           # Next.js on :3000
cd python-service && uvicorn main:app --reload  # FastAPI on :8000

# Type checking
npm run type-check

# Database types (after schema changes)
npm run db:generate

# Bundle analysis
npm run analyze
```

Before opening a PR:
1. `npm run type-check` — must pass with zero errors
2. `npm run lint` — must pass
3. Verify no tokens or secrets appear in any changed file
4. Verify new API routes validate input with Zod and check auth before any business logic
