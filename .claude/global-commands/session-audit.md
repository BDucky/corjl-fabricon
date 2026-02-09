---
description: "Analyze current session efficiency and log learnings"
---

# Session Audit

Analyze how this session went — tool call count, waste patterns, what could be improved — and write learnings to auto-memory for future sessions.

**Why this exists:** Continuous improvement. Without feedback on each session, the same waste patterns repeat. This command creates a feedback loop: work → audit → learn → work better next time.

## Instructions

### Step 1: Self-assessment (no tool calls — just think)
Based on this conversation, assess:
- **Total tool calls**: Rough count of tools used this session
- **Exploration calls**: How many were searching/reading before the first edit?
- **Edit efficiency**: How many edits were reverted or redone?
- **Test runs**: How many test/lint/typecheck runs? How many passed first try?
- **Duplicate reads**: Did you read any file more than once?
- **Sequential calls**: Did you miss opportunities to batch parallel calls?

### Step 2: Score the session
Rate each dimension 1-5:
- **Focus**: Did you stay on task or drift? (5 = laser focused)
- **Efficiency**: Tool calls per meaningful outcome? (5 = minimal waste)
- **Accuracy**: Did fixes work on first try? (5 = no rework)
- **Context protection**: Did you use sub-agents for exploration? (5 = main context clean)

### Step 3: Identify learnings
List 1-3 specific, actionable learnings. Examples:
- "For canvas export bugs, always read c-static-canvas.ts first — it's always involved"
- "flushPromises() is needed for any test involving onMounted async calls"
- "The PDF pipeline spans 3 packages — use /explore for initial research"

### Step 4: Write to memory
Append new learnings to `~/.claude/projects/-Users-admin/memory/MEMORY.md` under a `## Session Learnings` section. Don't duplicate existing learnings — only add genuinely new ones.

### Step 5: Report to user
```
Session Audit:
- Tool calls: ~N (exploration: X, edits: Y, tests: Z)
- Focus: X/5 | Efficiency: X/5 | Accuracy: X/5 | Context: X/5
- Learnings saved: <count>
  - <learning 1>
  - <learning 2>
```

## Rules
- This should take 1-2 tool calls max (only writing to memory file)
- Be honest in the assessment — understating waste doesn't help
- Only write learnings that are SPECIFIC and ACTIONABLE, not generic advice
- Check existing MEMORY.md learnings before writing to avoid duplicates
