---
description: "Assess task size and pick the right workflow. Args: <COR-XXXX or description>"
---

# Scope Assessment

Before starting ANY implementation, assess the task size and recommend the right workflow. This prevents using the heavy SDLC pipeline for a 2-line fix.

**Why this exists:** In past sessions, the full `pnpm ai sdlc COR-XXXX` pipeline was used for tasks that could have been a 5-minute quick-fix. The SDLC pipeline adds: Jira fetch → spec file creation → plan phase → ExitPlanMode → "implement the plan" → build phase → validation. That's 30+ tool calls of overhead before the first edit. For small tasks, this is massive waste.

## Instructions

### Step 1: Understand the task (max 3 tool calls)
- If `$ARGUMENTS` is a Jira ticket ID (COR-XXXX): fetch it using the Jira credentials from CLAUDE.local.md
- If it's a description: parse it directly
- Identify: what files are likely affected, what kind of change it is

### Step 2: Classify size
Based on the task, classify it:

**Tiny** (1-2 files, < 20 lines changed, no new tests needed):
- Typo fixes, config changes, simple prop additions, CSS tweaks
- Recommend: **Direct edit** — just do it, no workflow needed

**Small** (2-4 files, < 50 lines, maybe test updates):
- Bug fixes, small feature additions, test fixes, refactors
- Recommend: **/quick-fix** — branch → fix → validate → stage

**Medium** (4-8 files, new logic, needs tests):
- New composables, store changes, component additions
- Recommend: **/quick-fix** with a brief plan comment before starting

**Large** (8+ files, cross-package, architectural):
- New features spanning apps/packages, migration work, major refactors
- Recommend: **Full SDLC** — `pnpm ai sdlc COR-XXXX`

### Step 3: Output recommendation
```
Task: <1-line summary>
Size: <Tiny|Small|Medium|Large>
Files likely affected: <list>
Recommended workflow: <command or approach>
```

If the task is Tiny or Small, ask: "Want me to just do it now?"

## Rules
- Do NOT start implementing — only assess and recommend
- Do NOT use more than 3 tool calls for understanding
- If you can't assess from the ticket/description alone, use 1 sub-agent call to explore
- Always bias toward the LIGHTER workflow — only recommend full SDLC for genuinely large tasks

## Task

$ARGUMENTS
