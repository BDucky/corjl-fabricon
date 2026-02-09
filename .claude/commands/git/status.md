---
allowed-tools: Bash(git:*), Bash(gh:*)
description: Understand the current state of the git repository
---

# Git Status Report

Generate a comprehensive status report of the current git repository.

## Data Collection

Run these commands to gather repository information:

### Core Status
```bash
git branch --show-current                                    # Current branch
git status --short                                           # Changed files
git status --short --branch                                  # Branch tracking info
git rev-list --left-right --count HEAD...@{upstream} 2>/dev/null  # Ahead/behind
```

### Remote & Tracking
```bash
git remote -v                                                # Remote URLs
git branch -vv --list $(git branch --show-current)          # Upstream tracking
git fetch --dry-run 2>&1 | head -5                          # Pending fetches
```

### Changes Detail
```bash
git diff --stat HEAD 2>/dev/null | tail -1                  # Summary of changes
git diff --numstat 2>/dev/null                              # Lines added/removed per file
git diff --cached --stat 2>/dev/null | tail -1              # Staged changes summary
```

### Stash
```bash
git stash list --format="%gd|%gs|%cr"                       # Stash entries
```

### Recent History
```bash
git log --oneline -10 --format="%h|%an|%cr|%s"              # Recent commits
git log -1 --format="%cr"                                    # Last commit age
```

### Worktrees
```bash
git worktree list                                            # All worktrees
```

### Conflicts & Issues
```bash
git diff --name-only --diff-filter=U 2>/dev/null            # Unmerged files
```

---

## Output Format

Display the report using this structure:

### 📊 Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Branch** | `{branch_name}` | {branch_type_emoji} {branch_type} |
| **Sync Status** | ⬆️ {ahead} ahead, ⬇️ {behind} behind | {sync_status_emoji} {sync_message} |
| **Working Tree** | {modified} modified, {untracked} untracked | {tree_status_emoji} {tree_message} |
| **Staged** | {staged_count} files staged | {staged_emoji} {staged_message} |
| **Stash** | {stash_count} entries | {stash_emoji} {stash_message} |
| **Last Commit** | {last_commit_age} | ⏱️ {recency} |

**Status Legend:**
- 🟢 Clean/synced
- 🟡 Attention needed
- 🔴 Action required
- 🔀 Feature/topic branch
- 🏠 Main/default branch

---

### 🌐 Remote & Tracking

| Remote | URL | Status |
|--------|-----|--------|
| `origin` | `{origin_url}` | {connection_status} |
| `upstream` | `{upstream_url}` | {connection_status} |

| Local Branch | Upstream | Ahead | Behind | Status |
|--------------|----------|-------|--------|--------|
| `{branch}` | `{upstream_branch}` | {ahead} | {behind} | {diverge_status} |

---

### 📁 Working Tree Changes

**Only show this section if there are changes.**

| Status | File | +Lines | -Lines | Category |
|--------|------|--------|--------|----------|
| `M` | `{file_path}` | +{added} | -{removed} | {category} |
| `A` | `{file_path}` | +{added} | - | {category} |
| `D` | `{file_path}` | - | -{removed} | {category} |
| `??` | `{file_path}` | +{lines} | - | {category} |

**Totals:** {total_files} files | +{total_added} -{total_removed} lines

#### Staged Changes (if any)

| Status | File | +Lines | -Lines |
|--------|------|--------|--------|
| `A` | `{staged_file}` | +{added} | - |
| `M` | `{staged_file}` | +{added} | -{removed} |

---

### 📦 Stash

**Only show this section if stash is not empty.**

| Index | Message | Age |
|-------|---------|-----|
| `stash@{0}` | {stash_message} | {stash_age} |
| `stash@{1}` | {stash_message} | {stash_age} |

---

### 📜 Recent Commits (Last 10)

| Hash | Author | Age | Message |
|------|--------|-----|---------|
| `{short_hash}` | {author} | {age} | {message} |

---

### 🌳 Worktrees

**Only show this section if multiple worktrees exist.**

| Name | Branch | Path | Status |
|------|--------|------|--------|
| main | `{branch}` | `{path}` | {status} |
| {worktree_name} | `{branch}` | `{path}` | {status} |

---

### ⚠️ Issues & Conflicts

**Only show this section if there are issues.**

| Type | File | Action Required |
|------|------|-----------------|
| 🔴 Conflict | `{file}` | Resolve merge conflict |
| 🟡 Diverged | `{branch}` | Rebase or merge needed |

---

### 🎯 Suggested Actions

Based on the repository state, recommend actions:

| Priority | Action | Command | Reason |
|----------|--------|---------|--------|
| 🔴 High | {action} | `{command}` | {reason} |
| 🟡 Medium | {action} | `{command}` | {reason} |
| 🟢 Low | {action} | `{command}` | {reason} |

**Common recommendations:**

| Condition | Priority | Action | Command |
|-----------|----------|--------|---------|
| Behind remote | 🔴 High | Sync with remote | `git pull --rebase` |
| Uncommitted changes | 🟡 Medium | Review changes | `git diff` |
| Untracked files | 🟢 Low | Stage or ignore | `git add` or update `.gitignore` |
| Stash not empty | 🟢 Low | Review stashed work | `git stash show -p stash@{0}` |
| Diverged branch | 🔴 High | Rebase onto upstream | `git rebase origin/main` |
| Merge conflicts | 🔴 High | Resolve conflicts | Manual resolution required |
| No upstream set | 🟡 Medium | Set upstream | `git push -u origin {branch}` |

---

## Category Detection

Detect file categories based on path patterns:

| Pattern | Category |
|---------|----------|
| `src/components/`, `src/views/` | Component |
| `src/stores/`, `src/state/` | Store |
| `src/utils/`, `src/helpers/` | Utility |
| `src/types/`, `*.d.ts` | Types |
| `*.test.*`, `*.spec.*`, `__tests__/` | Test |
| `*.md`, `docs/` | Documentation |
| `*.config.*`, `.*/` | Config |
| `graphql/`, `*.graphql` | GraphQL |
| `src/hooks/` | Hook |
| `src/services/`, `src/api/` | Service |
| `apps/designer/` | Designer App |
| `apps/enduser/` | Enduser App |
| `packages/` | Package |

---

## Display Rules

1. **Conditional sections**: Only show sections that have data
2. **Empty state**: If working tree is clean and synced, show a success message
3. **Color consistency**: Use emoji consistently for status indication
4. **Truncation**: For long file paths, show `.../{last_two_dirs}/{filename}`
5. **Sorting**: Sort changed files by status (conflicts first, then modified, then untracked)

### Clean Repository Message

If no changes and fully synced:

```
### ✅ Repository Status: Clean

| Metric | Status |
|--------|--------|
| Working Tree | 🟢 Clean |
| Staging Area | 🟢 Empty |
| Sync Status | 🟢 Up to date with origin |

No actions required. Repository is in a clean state.
```
