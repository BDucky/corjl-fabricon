---
allowed-tools: Bash(git:*), Bash(pnpm:*)
description: "Initialize Worktree. Args: <worktree_name> [base_branch]"
---

# Initialize Worktree

Create a new git worktree for working on a task in isolation.

## Arguments

Format: `<worktree_name> [base_branch]`
- `worktree_name` (required): Name for the new worktree and branch
- `base_branch` (optional): Branch to base the worktree on (default: `dev`)

Examples:
- `/git:init-worktree feature-x` - Create worktree based on `dev`
- `/git:init-worktree fix-bug stage` - Create worktree based on `stage`
- `/git:init-worktree hotfix-123 prod` - Create worktree based on `prod`

## Input

$ARGUMENTS

## Instructions

1. Parse arguments to get `worktree_name` and `base_branch` (default: `dev`)
2. Create a new git worktree in the `trees/<worktree_name>` directory
3. Base the worktree on the specified `base_branch`
4. Report the successful creation of the worktree

## Git Worktree Setup

Execute these steps in order:

1. **Create the trees directory** if it doesn't exist:
   ```bash
   mkdir -p trees
   ```

2. **Check if worktree already exists**:
   - If `trees/<worktree_name>` already exists, report that it exists and stop
   - Otherwise, proceed with creation

3. **Fetch latest from origin**:
   ```bash
   git fetch origin <base_branch>
   ```

4. **Create the git worktree**:
   ```bash
   git worktree add trees/<worktree_name> -b <worktree_name> origin/<base_branch>
   ```
   - Creates a new branch `<worktree_name>` based on `origin/<base_branch>`
   - Checks out full repository in `trees/<worktree_name>`

5. **Install dependencies** (if needed):
   ```bash
   cd trees/<worktree_name>
   pnpm install
   ```

## Error Handling

- If the worktree already exists, report this and exit gracefully
- If git worktree creation fails, report the error
- If branch already exists, use existing branch instead of creating new one

## Verification

After setup, verify the worktree is working:
```bash
git worktree list
cd trees/<worktree_name>
git branch  # Should show * <worktree_name>
```

## Report

Report one of the following:
- Success: "Worktree '<worktree_name>' created successfully at trees/<worktree_name>"
- Already exists: "Worktree '<worktree_name>' already exists at trees/<worktree_name>"
- Error: "Failed to create worktree: <error message>"

## Notes

- Each worktree has its own working directory and branch
- Changes in one worktree don't affect others until merged
- Use `/git:clean-worktree <name>` to remove when done
- Run Claude Code in separate terminals for each worktree to work on multiple tasks in parallel
