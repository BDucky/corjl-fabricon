---
description: "Restore context from a previous session's handoff"
---

# Resume Session

Load the handoff file from a previous session and restore working context instantly, skipping the exploration phase entirely.

**Why this exists:** When starting a new session on an in-progress task, the agent typically spends 10-30 tool calls rediscovering file locations, understanding the task, and figuring out what's already been done. This command loads a saved handoff and jumps straight to productive work.

## Instructions

### Step 1: Detect current branch
Run `git branch --show-current` to get the current branch name.

### Step 2: Load handoff file
Read `~/.claude/handoffs/<branch-name>.md` (with `/` replaced by `-` in branch name).

If no handoff file exists, check `~/.claude/compact-state/` for the most recent session state file.

If neither exists, tell the user: "No handoff found for this branch. Use /handoff at the end of sessions to save state."

### Step 3: Load relevant files (parallel)
Based on the handoff's "Files touched" list, read ALL listed files in a single parallel turn (with limit=80 each).

### Step 4: Report restored state
Print a concise summary:
```
Resumed from handoff:
- Task: <from handoff>
- Status: <from handoff>
- Branch: <current branch>
- Files loaded: <count>
- Next step: <what to do next based on handoff status>
```

### Step 5: Ask what to do
Ask the user: "Ready to continue. What should I work on next?" — unless the handoff has a clear "remaining" section, in which case suggest: "The handoff says X is remaining. Should I continue with that?"

## Rules
- ALL file reads MUST happen in a single parallel turn
- Do NOT explore or search the codebase — only read files listed in the handoff
- If the handoff is stale (files have changed significantly since it was written), warn the user
- This command should complete in 3 tool calls or fewer (git branch + read handoff + parallel file reads)
