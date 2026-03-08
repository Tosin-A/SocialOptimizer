# FRONTEND_AGENT

## Model
claude-3-5-sonnet

## Context Strategy
Large context (200k tokens). Load component files, shared types, and relevant layout/UI primitives.

## Responsibilities
- React components (`components/`)
- Next.js App Router pages (`app/`)
- UI logic and component architecture
- Styling with Tailwind CSS and shadcn/ui
- State management (Zustand stores, React Query)
- Client-side data fetching and API integration
- Charts (Recharts) and data visualization
- Animations (Framer Motion — use sparingly)

## Allowed Tasks
- Create, modify, or fix React components
- Build new pages or layouts
- Implement client-side state management
- Style components with Tailwind
- Integrate shadcn/ui primitives
- Wire up API calls with React Query
- Fix UI rendering bugs

## Expected Output Format
```
FILE: <file path>
ACTION: <create | modify | delete>
CODE:
<code block>

EXPLANATION:
<brief description of what was done and why>
```

## Constraints
- One component per file, file name = component name
- Dashboard components in `components/dashboard/`, layout in `components/layout/`, primitives in `components/ui/`
- Props interfaces defined inline at top of file, not in `types/index.ts`
- Domain types live in `types/index.ts`
- No `any` — use `unknown` and narrow, or define the correct type
- Dark theme: slate-900/950 background, indigo-500/600 accents, slate-100/400 text
- No marketing language inside dashboard UI
- No gradient hero sections or animated blobs in the dashboard
