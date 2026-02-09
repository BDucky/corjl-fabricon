---
allowed-tools: Bash(git:*), Bash(gh:*)
description: "Clean Worktree. Args: <worktree_name> | ALL"
---

# Clean Worktree

Remove git worktree(s), associated branch(es), and close any open PRs.

## Arguments

Format: `<worktree_name>` or `ALL`

- `worktree_name`: Name of a specific worktree to clean
- `ALL`: Special keyword to clean ALL worktrees (except main)

Examples:
- `/git:clean-worktree feature-x` - Clean single worktree
- `/git:clean-worktree ALL` - Clean all worktrees

Input: $ARGUMENTS

## Mode Detection

Parse `$ARGUMENTS` to determine mode:

1. If `$ARGUMENTS` equals "ALL" (case-insensitive):
   - Mode: **CLEAN_ALL**
   - Get list of all worktrees from `git worktree list`
   - Filter out main worktree (the one without "trees/" in path)

2. Otherwise:
   - Mode: **CLEAN_SINGLE**
   - worktree_name = $ARGUMENTS

## Instructions

### Single Mode
1. Check if the worktree exists
2. Remove the worktree if it exists
3. Prune worktree references
4. Close any open PR for the branch
5. Delete the remote branch
6. Delete the local branch
7. Report the results

### ALL Mode
1. List all worktrees in `trees/` directory
2. Show summary and confirm with user
3. For each worktree, execute single mode cleanup
4. Report overall summary

## List Worktrees (ALL mode only)

```bash
# Get all worktrees in trees/ directory
git worktree list | grep "trees/" | awk '{print $1}' | xargs -I{} basename {}
```

- Parse each line to extract worktree name
- Store list for iteration
- Report number of worktrees found

## Safety Checks

### Before Single Cleanup
- List any uncommitted changes in the worktree
- Warn about any unpushed commits on the branch
- Show PR status if exists

### Before ALL Cleanup
- List all worktrees that will be cleaned
- Show total count
- Report any worktrees with uncommitted changes
- Report any worktrees with open PRs
- **IMPORTANT**: Confirm with user before proceeding (show warning)

## Cleanup Steps

Execute these steps in order for each worktree:

### Step 1: Check worktree status
```bash
git worktree list
```

### Step 2: Remove the worktree (if exists)
```bash
git worktree remove trees/<worktree_name> --force
```
- Use `--force` to remove even if there are uncommitted changes
- This removes the worktree directory and its contents

### Step 3: Prune worktree references
```bash
git worktree prune
```

### Step 4: Close Associated PR (if exists)

Before deleting the branch, check for and close any open PR:

1. **Find PR by head branch**:
   ```bash
   gh pr list --head <worktree_name> --state open --json number,url
   ```

2. **If PR exists, close it with comment**:
   ```bash
   gh pr close <worktree_name> --comment "Closed automatically by clean-worktree command" --delete-branch
   ```
   - `--delete-branch` flag will also delete the remote branch

3. **Handle no PR case**:
   - If no PR found, continue with local cleanup
   - Report: "No open PR found for branch '<worktree_name>'"

### Step 5: Delete remote branch (if not deleted by gh pr close)
```bash
git push origin --delete <worktree_name> 2>/dev/null || true
```
- Ignore error if already deleted by PR close or doesn't exist

### Step 6: Delete local branch (if exists and not current branch)
```bash
git branch -D <worktree_name>
```
- Use `-D` to force delete even if not fully merged
- Skip if the branch doesn't exist

### Step 7: Verify cleanup
```bash
git worktree list
git branch --list <worktree_name>
```

## Cleanup Execution

### Single Mode
Execute cleanup steps for the specified worktree_name.

### ALL Mode
For each worktree in the list:
1. Extract worktree_name from path
2. Execute all cleanup steps (worktree removal, PR close, branch deletion)
3. Track success/failure for each
4. Continue with next worktree even if one fails

Report summary at end:
- Total worktrees processed
- Successfully cleaned
- Failed (with reasons)

## Error Handling

- If worktree doesn't exist, report and continue with branch cleanup
- If branch doesn't exist, report that it's already clean
- If removal fails due to permissions, report the error
- Always run `git worktree prune` regardless of other steps
- If `gh` CLI fails, continue with local cleanup only
- For ALL mode: continue processing remaining worktrees even if one fails

## Expected Output

### Single Mode
- Success: "Worktree '<worktree_name>' cleaned up successfully (worktree, PR, and branch removed)"
- Success (no PR): "Worktree '<worktree_name>' cleaned up successfully (no PR found)"
- Partial: "Worktree '<worktree_name>' removed, branch did not exist"
- Already clean: "Worktree '<worktree_name>' does not exist"
- Error: "Failed to clean worktree: <error message>"

### ALL Mode
```
Clean All Worktrees Summary
===========================
Total worktrees found: X
Successfully cleaned: Y
Failed: Z

Details:
- worktree-1: Success (PR #123 closed)
- worktree-2: Success (no PR)
- worktree-3: Failed - <reason>
```

## Notes

- This operation is destructive and cannot be undone
- All uncommitted work in worktrees will be lost
- Branches will be deleted even if not merged
- Open PRs will be closed with a comment
- Remote branches associated with PRs will be deleted
- The main worktree (not in trees/ directory) will never be cleaned
- Use this after tasks are completed or to clean up failed attempts
- For ALL mode: carefully review the list before confirming
