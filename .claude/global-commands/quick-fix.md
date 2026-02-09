---
description: "Lightweight fix without SDLC. Args: <description>"
---

# Quick Fix

Implement a small, targeted fix without the full SDLC pipeline overhead. No spec files, no Jira, no Linear tracking, no phases.

**Why this exists:** The full SDLC pipeline (Plan → Build → Test → Report → Ship) adds significant overhead for small fixes. This command goes straight to: understand → fix → validate.

## Instructions

### Step 1: Understand (max 5 tool calls)
- Read the relevant file(s) directly — check Key File Registry first
- If you need to explore, use a **Task sub-agent** (do NOT explore in main context)
- Understand the root cause

### Step 2: Branch
- Create a feature branch: `git checkout -b fix/<short-description>`
- If already on a feature branch, skip this step

### Step 3: Fix
- Implement the minimal change needed
- Touch as few files as possible
- Do NOT fix unrelated issues

### Step 4: Validate (autonomous loop, max 3 iterations)
Run this loop without user intervention:
1. `pnpm lint:affected --fix`
2. `pnpm lint:affected` — if errors, fix and restart loop
3. `pnpm typecheck:affected` — if errors, fix and restart loop
4. `pnpm test:affected` — if failures, analyze output, fix, and restart loop

If all pass, continue. If still failing after 3 iterations, report remaining issues.

### Step 5: Stage
- `git add` the changed files (specific files, not `-A`)
- Do NOT commit — let the user decide when to commit

### Step 6: Report
Summarize in this format:
```
Files changed: <list>
What was fixed: <1 sentence>
Validation: lint ✓/✗ | typecheck ✓/✗ | test ✓/✗
```

## Rules
- Max 5 tool calls for understanding. If you need more, delegate to sub-agent.
- Do NOT create spec files, plans, or documentation
- Do NOT run full `pnpm lint` or `pnpm test` — always use `:affected` variants
- Do NOT ask user to paste errors — read test/lint output yourself

## Fix Description

$ARGUMENTS
