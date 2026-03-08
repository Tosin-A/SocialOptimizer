# Routing Memory

This file records cases where the orchestrator failed to delegate to the correct subagent. Each entry creates a new routing rule to prevent the same mistake.

This memory grows over time as the system self-corrects.

---

## Routing Rules

_(No entries yet. Rules will be appended as routing errors are detected.)_

---

## Entry Template

```
TASK_PATTERN:
<description of the task type>

MISSED_AGENT:
<agent that should have handled it>

NEW_RULE:
<routing rule to prevent recurrence>
```
