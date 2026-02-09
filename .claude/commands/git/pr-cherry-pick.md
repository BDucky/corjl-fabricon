---
allowed-tools: Bash(gh:*), Bash(git checkout:*), Bash(git pull:*), Bash(git cherry-pick:*), Bash(git push:*), Bash(git status:*), Bash(git log:*), Bash(git diff:*), Bash(git branch:*), Bash(git fetch:*), Read
description: "Cherry-pick PR commits to another branch. Args: <pr_number> <target_branch>"
---

# Cherry-pick PR to Target Branch

Cherry-pick commits from a GitHub PR to a target branch, then push and create a new PR with proper labels and reviewers.

## Safety Rules (DO NOT VIOLATE)

- **NEVER switch to another branch after completing the workflow** - Stay on the cherry-pick branch
- **NEVER delete local branches** - Only delete remote source branches as specified
- **NEVER run `git checkout stage` or `git checkout dev`** at the end of the workflow
- **NEVER run `git branch -D <branch>`** for any local branch

## Instructions

- **IMPORTANT: Always analyze the PR first before cherry-picking**
- **IMPORTANT: Skip merge commits - only cherry-pick actual code changes**
- **IMPORTANT: Auto-assign to current user**
- **IMPORTANT: Add ALL involved people from original PR as reviewers**
  - Collect from: commit authors + timeline actors (reviewers, commenters, assignees) + PR author
  - Exclude bots (e.g., `claude`)
  - Exclude current user (cannot self-review)

## Workflow

### Step 1: Analyze the PR and Get Involved People

```bash
# Get PR info
gh pr view <PR_NUMBER> --json commits,files,additions,deletions,title,baseRefName,headRefName,author

# Get current user login
CURRENT_USER=$(gh api user --jq '.login')

# Get ALL involved people from multiple sources:

# 1. Commit authors (people who made commits)
gh pr view <PR_NUMBER> --json commits --repo CorjlSoftware/corjl-webapp | jq -r '.commits[].authors[].login' | sort -u

# 2. Timeline actors (reviewers, commenters, assignees, etc.)
gh api repos/CorjlSoftware/corjl-webapp/issues/<PR_NUMBER>/timeline --paginate | jq -r '.[] | select(.actor) | .actor.login' | sort -u

# 3. PR author
gh pr view <PR_NUMBER> --json author --repo CorjlSoftware/corjl-webapp | jq -r '.author.login'

# Combine all sources, exclude bots (claude) and current user
# Final reviewer list should include ALL human participants
```

**IMPORTANT: When collecting reviewers:**
1. Combine commit authors + timeline actors + PR author
2. Exclude bots (e.g., `claude`)
3. Exclude current user (GitHub doesn't allow self-review)
4. Add ALL remaining users as reviewers using multiple `--reviewer` flags

### Step 2: Check if Commits Already Exist in Target Branch

```bash
# Check if commit is already in target branch
git fetch origin
git branch -a --contains <commit_hash> | grep -E '<target_branch>|origin/<target_branch>'
```

**If commits already exist in target branch**, skip cherry-pick and go to **Step 2b: Handle Already Cherry-picked**.

### Step 2a: Execute Cherry-pick (Normal Case)

```bash
# Fetch and create branch
git fetch origin
git checkout <target_branch>
git pull origin <target_branch>
git checkout -b cherry-pick/pr-<PR_NUMBER>-to-<target_branch>

# Cherry-pick non-merge commits (skip merge commits)
git cherry-pick <commit_hash_1> <commit_hash_2> ...
```

Then continue to **Step 3: Push and Create PR**.

### Step 2b: Handle Already Cherry-picked

If the commits are already in the target branch, perform these actions instead:

```bash
# Update labels on original PR: remove base branch label, add target branch label
gh pr edit <PR_NUMBER> --remove-label "<base_branch>" --add-label "<target_branch>" --repo CorjlSoftware/corjl-webapp

# Add comment explaining no cherry-pick needed
gh pr comment <PR_NUMBER> --body "$(cat <<'EOF'
## No Cherry-pick Needed

The changes from this PR are already present in `<target_branch>` branch.

**Reason**: The commits were included through upstream merges.

**Commits already in `<target_branch>`**:
- [`<commit_hash_short>`](https://github.com/CorjlSoftware/corjl-webapp/commit/<commit_hash_full>) - <commit_message>
...

**Actions taken**:
- ✅ Removed `<base_branch>` label
- ✅ Added `<target_branch>` label
- ✅ Deleted source branch `<head_branch>`
EOF
)" --repo CorjlSoftware/corjl-webapp

# Delete the source branch from remote
gh api -X DELETE repos/CorjlSoftware/corjl-webapp/git/refs/heads/<ORIGINAL_HEAD_BRANCH> 2>/dev/null || echo "Branch already deleted or protected"
```

Then output the **Already Cherry-picked Result** format and stop.

### Step 3: Push and Create PR

```bash
# Push branch
git push -u origin cherry-pick/pr-<PR_NUMBER>-to-<target_branch>

# Create PR with label, assignee, and ALL involved reviewers
# Use multiple --reviewer flags for each person
gh pr create \
  --base <target_branch> \
  --title "<ORIGINAL_PR_TITLE>" \
  --label "<target_branch>" \
  --assignee "@me" \
  --reviewer "<PERSON_1>" \
  --reviewer "<PERSON_2>" \
  --body "$(cat <<'EOF'
## Summary
Cherry-pick from PR #<PR_NUMBER>

## Original PR
- Title: <ORIGINAL_TITLE>
- Author: @<ORIGINAL_AUTHOR>
- URL: <ORIGINAL_PR_URL>

## Involved People
@<PERSON_1>, @<PERSON_2>, ...

## Changes
<List files changed>

## Test Plan
- [ ] Manual testing
- [ ] TypeScript check passes
EOF
)"

# Add "cherry-pick" label to original PR and remove "dev" label if exists
gh pr edit <PR_NUMBER> --add-label "cherry-pick" --remove-label "dev" --repo CorjlSoftware/corjl-webapp

# Delete the old branch from remote (source branch of original PR)
gh api -X DELETE repos/CorjlSoftware/corjl-webapp/git/refs/heads/<ORIGINAL_HEAD_BRANCH> 2>/dev/null || echo "Branch already deleted or protected"
```

**Final State**: Stay on the current branch. Do NOT switch branches or delete local branches.

## Output Format

### PR Analysis

| Field | Value |
|-------|-------|
| PR Number | #XXX |
| Title | ... |
| Author | @username |
| Commits | X (Y to cherry-pick) |
| Files | Z files (+A/-B) |
| Commit Authors | @user1, @user2, ... |
| Timeline Actors | @user3, @user4, ... |
| All Involved | @user1, @user2, @user3, ... (combined, deduplicated) |

### Result (Normal Cherry-pick)

| Field | Value |
|-------|-------|
| New PR | https://github.com/CorjlSoftware/corjl-webapp/pull/XXX |
| Target | stage/dev/prod |
| Label | stage/dev/prod |
| Assignee | @me |
| Reviewers | @user1, @user2, ... |

### Already Cherry-picked Result

| Field | Value |
|-------|-------|
| Status | ⚠️ No cherry-pick needed |
| Reason | Commits already in target branch |
| PR Number | #XXX |
| Original Branch | `<base_branch>` |
| Target Branch | `<target_branch>` |
| Label Removed | `<base_branch>` |
| Label Added | `<target_branch>` |
| Branch Deleted | `<head_branch>` |

## Arguments

Format: `<PR_NUMBER> [target_branch]`
- Example: `247 prod`
- Example: `247 dev`
- Default target: `stage`

## Input

$ARGUMENTS
