---
allowed-tools: Bash(git:*)
description: "Create a new branch from current branch. Args: <branch_name>"
---

# Git Create Branch

Create a new branch from the current branch and switch to it.

## Arguments

- `$ARGUMENTS` - The name of the new branch to create

## Instructions

1. Validate branch name from arguments:
   - If `$ARGUMENTS` is empty, report error and ask for branch name
   - Follow branch naming conventions in `ai-docs/workflows/git/branch-naming.md`

2. Check current state:
   - `git branch --show-current` - get current branch name
   - `git status --short` - check for uncommitted changes

3. If there are uncommitted changes, warn the user but proceed (changes will carry over to new branch)

4. Create and switch to new branch:
   - `git checkout -b $ARGUMENTS` - create and switch to new branch

5. Verify the switch:
   - `git branch --show-current` - confirm on new branch

## Report

Display result in this format:

### Success

| Field | Value |
|-------|-------|
| From Branch | `source-branch` |
| New Branch | `new-branch-name` |
| Status | Created and switched |

Or if failed:

### Failed

**Reason:** <error message>

## Examples

```
/git:create-branch feature/add-login
/git:create-branch fix/COR-1234-button-bug
/git:create-branch chore/update-deps
```
