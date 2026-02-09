---
allowed-tools: Bash(gh:*), Bash(git:*), Bash(python3:*)
description: "Create and post a Jira comment for work completed. Args: [jira_key] [--skip-review]"
---

# Jira Comment Template Generator

Generate a formatted Jira comment template to report completed work, including GitHub PR details.

## Arguments

- `jira_key` - The Jira issue key (e.g., COR-123) (optional - will auto-detect from branch/PR)
- `--skip-review` - Skip the review phase and output immediately (optional)

## Instructions

### Step 1: Check Branch Push Status

```bash
# Get current branch name
git branch --show-current

# Check if branch has been pushed to remote
git ls-remote --heads origin $(git branch --show-current)
```

**If branch is NOT pushed to remote:**
Display the following message and STOP:

```markdown
### ⚠️ Branch Not Pushed

Your current branch `<branch_name>` has not been pushed to the remote repository.

Please push your branch first:
\`\`\`bash
git push -u origin <branch_name>
\`\`\`

Then run this command again.
```

### Step 2: Auto-Detect Jira Key

Try to detect the Jira key from multiple sources:

```bash
# Get current branch name
BRANCH=$(git branch --show-current)

# Extract Jira key from branch name (pattern: COR-XXXX, case-insensitive)
echo "$BRANCH" | grep -oiE 'COR-[0-9]+'

# Get PR description if PR exists
gh pr view --json body --jq '.body' 2>/dev/null || echo ""
```

**Detection Priority:**
1. **From Arguments**: If user provided `jira_key` in arguments, use that
2. **From Branch Name**: Look for pattern `COR-XXXX` in branch name (e.g., `feature/COR-1234-fix-bug`)
3. **From PR Description**: Look for pattern `COR-XXXX` in PR body/description
4. **Manual Input**: If not found anywhere, ask user to provide

**If Jira key is detected, confirm with user:**

```markdown
### 🔍 Jira Key Detected

| Source | Jira Key |
|--------|----------|
| {source} | `{detected_key}` |

Is this the correct Jira issue for this work?

- **Yes** - Continue with `{detected_key}`
- **No** - Enter a different Jira key
```

Wait for user confirmation:
- If user confirms, proceed with detected key
- If user says no or provides a different key, use the user-provided key

**If NO Jira key is detected:**

```markdown
### ❓ Jira Key Required

Could not detect a Jira key from:
- Branch name: `{branch_name}`
- PR description: {PR exists? "checked" : "no PR found"}

Please enter the Jira issue key (e.g., COR-123):
```

Wait for user input before proceeding.

### Step 3: Gather Information for Comment Generation

Gather information from multiple sources to generate an accurate comment.

#### 3a. GitHub PR Information

```bash
# Get current branch
BRANCH=$(git branch --show-current)

# Get PR details for current branch
gh pr view --json url,title,body,number 2>/dev/null || echo "NO_PR"

# Get GitHub repo URL
git remote get-url origin
```

#### 3b. Git History (if PR description is insufficient)

If the PR description doesn't provide enough context, gather information from git history:

```bash
# Fetch latest from remote
git fetch origin

# Get the base branch (usually dev)
BASE_BRANCH="dev"

# Get commits in this branch (not in base)
git log origin/${BASE_BRANCH}..HEAD --oneline

# Get detailed commit messages for summary
git log origin/${BASE_BRANCH}..HEAD --pretty=format:"- %s" --no-merges

# Get files changed
git diff origin/${BASE_BRANCH}...HEAD --stat

# Get detailed diff for understanding changes (if needed)
git diff origin/${BASE_BRANCH}...HEAD --name-only
```

#### Information Sources Priority

Use the following sources to understand what work was done:

| Priority | Source | What to Extract |
|----------|--------|-----------------|
| 1 | PR Description | Summary, cause, resolution details |
| 2 | PR Title | Brief description of change type |
| 3 | Commit Messages | List of changes made |
| 4 | Files Changed | Scope and impact of changes |
| 5 | Diff Content | Technical details if needed |

**Guidelines:**
- If PR exists with good description → use PR description as primary source
- If PR exists but description is sparse → supplement with commit messages
- If no PR exists → use commit messages and file changes to understand the work
- Always include the branch name and PR URL (if available) in the final comment

### Step 4: Ask for Cc Recipients

Ask the user:
```markdown
### 📋 Cc Recipients

Who would you like to Cc on this comment? (Optional)

Enter display names separated by commas, or press Enter to skip.

**Mention Syntax:**
- For names without spaces: `@john.doe`
- For names with spaces: `@"John Doe"`

Example: `@"John Doe", @"Jane Smith"` or just press Enter for none.
```

Wait for user input before proceeding.

**Note:** The script will search Jira for each user and convert them to proper mentions that will notify the users.

### Step 5: Generate Comment Template

Generate a comment template based on the PR information gathered.

**Include sections only if applicable based on the PR description/changes:**

```markdown
- **Cause:**
  - [Description of the cause of the issue - include if this is a bug fix]

- **Resolution:**
  - [First change/fix made]
  - [Second change/fix made]
  - [Additional changes as needed]

- **Impact:**
  - [Impact description - include if there are notable impacts]

- **Scope:**
  - [Scope description - all users / specific assets / etc.]

---

**GitHub Reference:**
\`\`\`
PR: <github_pr_url>
Branch: <branch_name>
\`\`\`

---

Cc: <cc_recipients>
```

**Guidelines for sections:**
- **Cause**: Include for bug fixes - use indented bullet points to describe what was causing the issue
- **Resolution**: Always include - use indented bullet points to list each change made
- **Impact**: Include if changes affect existing functionality, performance, or user experience
- **Scope**: Include if the fix is limited to specific scenarios (e.g., only affects certain assets/designs) or applies universally

### Step 6: Review Phase (unless `--skip-review` is provided)

Present the generated comment template for review:

```markdown
### 📝 Proposed Jira Comment

**For Issue:** {jira_key}

---

<generated comment template>

---

| Field | Value |
|-------|-------|
| Jira Key | `{jira_key}` |
| Branch | `{branch_name}` |
| PR | #{pr_number} or N/A |
| Cc | {cc_recipients} or None |

---

**Actions:**
- **Post** - Add this comment to the Jira issue
- **Modify** - Edit the content before posting
- **Cancel** - Abort without posting

Would you like to post this comment to Jira, modify it, or cancel?
```

- Wait for user confirmation before proceeding
- If user wants to modify, apply their suggested changes and show again
- If user cancels, abort the process

### Step 7: Post Comment to Jira

After user confirms, save the comment to a temporary file and post it to Jira:

```bash
# Save comment to temporary file
cat > /tmp/jira_comment.md << 'EOF'
<final comment content>
EOF

# Post comment to Jira using the add_comment.py script
python3 .claude/skills/jira/scripts/add_comment.py {jira_key} --file /tmp/jira_comment.md

# Clean up
rm /tmp/jira_comment.md
```

**On Success:**

Display the result:

```markdown
### ✅ Comment Posted to Jira

| Field | Value |
|-------|-------|
| Jira Key | `{jira_key}` |
| Comment URL | {comment_url} |
| Issue URL | https://corjl-software.atlassian.net/browse/{jira_key} |
| Branch | `{branch_name}` |
| PR | {pr_url} or N/A |
| Posted By | {author} |
| Posted At | {created} |

💡 **Tip:** Click the Comment URL above to view your comment in Jira.
```

**On Failure:**

```markdown
### ❌ Failed to Post Comment

**Error:** {error_message}

**Troubleshooting:**
- Check that your Jira API token has write permissions (`write:comment:jira`)
- Verify you have "Add Comments" permission on the project
- See `.claude/skills/jira/SKILL.md` for token setup

**Fallback:** Copy the comment below and paste it manually:

---

<comment content>

---
```

## Report Format

### Success

```markdown
### ✅ Comment Posted

| Field | Value |
|-------|-------|
| Jira Key | `{jira_key}` |
| Comment URL | {comment_url} |
| Branch | `{branch_name}` |
| PR | #{pr_number} or N/A |
| Sections | {list of included sections} |
```

### Branch Not Pushed

```markdown
### ⚠️ Branch Not Pushed

Branch `{branch_name}` needs to be pushed before generating comment.

Run: `git push -u origin {branch_name}`
```

### Jira Key Not Found

```markdown
### ❓ Jira Key Required

Could not auto-detect Jira key from branch name or PR description.

Please provide the Jira issue key:
- Run again with key: `/jira:work-report COR-123`
- Or enter the key when prompted
```

### Post Failed

```markdown
### ❌ Failed to Post Comment

**Error:** {error_message}

Check your Jira API token has write permissions. See `.claude/skills/jira/SKILL.md`.
```

## Arguments

$ARGUMENTS
