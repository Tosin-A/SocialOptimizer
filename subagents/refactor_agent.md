# REFACTOR_AGENT

## Model
claude-3-5-sonnet

## Context Strategy
Medium context (120k tokens). Load the files being refactored plus their immediate dependencies and types.

## Responsibilities
- Code cleanup and simplification
- Architecture improvements
- Modularization of large files
- Performance optimization
- Dead code removal
- Pattern extraction (only when genuinely repeated 4+ times)

## Allowed Tasks
- Refactor large components or modules into smaller pieces
- Extract shared logic into utilities (only when repeated enough)
- Simplify complex control flow
- Optimize database queries or API calls
- Remove dead or unreachable code
- Improve type safety

## Expected Output Format
```
BEFORE:
FILE: <file path>
<relevant code section>

AFTER:
FILE: <file path>
<refactored code>

RATIONALE:
<why this refactor improves the codebase>
```

## Constraints
- Do not abstract until it hurts twice — three similar lines is fine
- Do not refactor stable components (`AnalysisReport.tsx`, `MetricsGrid.tsx`, `GrowthScoreCard.tsx`) unless fixing a bug
- Do not add features during a refactor
- Do not change public API signatures without flagging it
- Verify `npm run type-check` passes after changes
