---
allowed-tools: Bash(git:*)
description: "Sync current branch with upstream. Args: [base_branch] (optional)"
---

# Git Sync

Sync the current branch with its upstream remote branch or a specified base branch.

## Arguments

Format: `[base_branch]` (optional)
- If provided: Sync current branch with the specified base branch
- If omitted: Sync current branch with its upstream tracking branch

Examples:
- `/git:sync` - Sync with upstream tracking branch
- `/git:sync dev` - Rebase current branch onto latest `dev`
- `/git:sync stage` - Rebase current branch onto latest `stage`

## Input

$ARGUMENTS

## Instructions

### Step 1: Check Current State

```bash
# Get current branch
git branch --show-current

# Check for uncommitted changes
git status --short

# Check upstream tracking
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null
```

### Step 2: Handle Uncommitted Changes

If there are uncommitted changes:
- Stash them automatically: `git stash push -m "Auto-stash before sync"`
- Remember to pop after sync

### Step 3: Fetch Latest

```bash
git fetch origin
```

### Step 4: Sync Branch

**If base_branch is specified:**
```bash
git rebase origin/<base_branch>
```

**If no base_branch (sync with upstream):**
```bash
git pull --rebase
```

### Step 5: Handle Conflicts

If rebase conflicts occur:
1. Report the conflict files
2. Suggest: `git rebase --abort` to cancel
3. Or guide user to resolve conflicts manually

### Step 6: Restore Stashed Changes

If changes were stashed:
```bash
git stash pop
```

If stash pop has conflicts, report them.

## Report

### Success

| Field | Value |
|-------|-------|
| Branch | `current-branch` |
| Synced With | `origin/base-branch` |
| Commits Pulled | X new commits |
| Status | ✅ Up to date |

### Conflict

| Field | Value |
|-------|-------|
| Branch | `current-branch` |
| Status | ⚠️ Conflicts detected |
| Files | `file1.ts`, `file2.ts` |
| Action | Resolve conflicts or run `git rebase --abort` |

### Already Up to Date

| Field | Value |
|-------|-------|
| Branch | `current-branch` |
| Status | ✅ Already up to date |

## Error Handling

- If no upstream is set and no base_branch provided, report error and suggest setting upstream
- If fetch fails, report network error
- If rebase fails due to conflicts, provide clear instructions
- Always restore stashed changes even if sync fails
