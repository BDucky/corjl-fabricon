---
description: "Save session state for the next session to pick up"
---

# Session Handoff

Capture the current session's working state into a handoff file so the next session (or a resumed session after compaction) can pick up instantly without re-exploring.

**Why this exists:** 8 out of 13 analyzed sessions hit context compression, losing working state. When starting a new session on the same task, the agent wastes 10-20 tool calls rediscovering what was already known. This command creates a compact state snapshot.

## Instructions

### Step 1: Gather state (parallel)
Run these in parallel:
- `git branch --show-current`
- `git diff --name-only` (modified files)
- `git diff --cached --name-only` (staged files)
- `git log --oneline -5` (recent commits)

### Step 2: Summarize current work
Based on the conversation so far, write a concise summary:
- **Task**: What ticket/task is being worked on
- **Status**: What's done, what's remaining
- **Key decisions**: Any architectural or approach decisions made during this session
- **Blockers**: Anything unresolved or waiting on the user
- **Files touched**: List of files modified/created with 1-line description of each change
- **Test status**: Last known test/lint/typecheck results

### Step 3: Write handoff file
Write the summary to `~/.claude/handoffs/<branch-name>.md` (replace `/` with `-` in branch name).

If a handoff file already exists for this branch, overwrite it with fresh state.

### Step 4: Output to user
Print the summary so the user can review it, plus:
```
Handoff saved to: ~/.claude/handoffs/<branch-name>.md
Next session: Start with "/resume" to restore this context.
```

## Rules
- Keep the handoff file under 40 lines — it will be injected into the next session's context
- Do NOT include full file contents — only file paths and 1-line descriptions
- Do NOT include tool call history or conversation details — only outcomes
- Write in a format that a fresh Claude session can parse and act on immediately
