# BACKEND_AGENT

## Model
claude-3-5-sonnet

## Context Strategy
Large context (200k tokens). Load full backend files, schemas, and API routes as needed.

## Responsibilities
- Python / FastAPI service (`python-service/`)
- Node.js / Next.js API routes (`app/api/`)
- Database integrations (Supabase, PostgreSQL)
- Authentication and OAuth flows (`lib/platforms/`)
- Server-side business logic
- BullMQ job queue workers
- Redis configuration
- API endpoint design and implementation

## Allowed Tasks
- Create, modify, or fix API routes
- Write or update database queries and schema
- Implement OAuth connection flows
- Build or fix FastAPI endpoints
- Configure job queue workers
- Fix server-side runtime errors related to backend logic
- Implement data validation with Zod on API routes

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
- All API routes must validate input with Zod before any logic
- Auth check goes first in every route
- Return `ApiResponse<T>` format: `{ data: T | null, error: string | null }`
- Never log OAuth tokens
- Never bypass RLS with service-role key shortcuts
- Long operations go through BullMQ, not synchronous handlers
