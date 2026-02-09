---
description: "Jira Task Planning"
---

# Jira Task Planning

Fetch a Jira task and create a detailed implementation plan in `.ai/specs/`.

## Variables

- jira_key: $ARGUMENTS (e.g., COR-123)

## Prerequisites

- Jira skill configured at `.claude/skills/jira/`
- `JIRA_API_TOKEN` environment variable (or 1Password integration)

## Instructions

### 1. Fetch Jira Task

Use the Jira skill to fetch task details:

```bash
python3 .claude/skills/jira/scripts/get_issue.py $ARGUMENTS
```

The output is JSON with these fields:
- **key**: Issue key (e.g., COR-123)
- **summary**: Issue title
- **description**: Issue description (may be in ADF format)
- **issuetype**: Bug, Story, Task, etc.
- **status**: Current status
- **priority**: Priority level
- **labels**: Array of labels
- **url**: Link to Jira issue

### 2. Determine Workflow Type

Based on issue type, choose the appropriate workflow:
- **Story/Feature** → Feature workflow (full planning)
- **Bug** → Bug workflow (investigation + fix)
- **Task/Chore** → Chore workflow (direct implementation)

### 3. Create or Update Plan File

**IMPORTANT**: First check if a spec file already exists for this Jira key:
```bash
ls .ai/specs/{JIRA_KEY}*.md 2>/dev/null || echo "No existing spec file"
```

If a spec file exists (e.g., `.ai/specs/COR-123-chore-foo.md`):
- **Update the existing file** instead of creating a new one
- Fill in the "_To be filled by AI..._" sections with your analysis
- Do NOT create a new file with a different name

If no spec file exists, create one in `.ai/specs/` with naming format:
```
.ai/specs/{JIRA_KEY}-{issue-type}-{short-summary}.md
```

Example: `.ai/specs/PROJ-123-feature-add-dark-mode.md`

### 4. Plan Format

Use the following template based on issue type:

#### For Features/Stories:

```md
# Feature: {summary}

## Jira Reference
- **Key**: {jira_key}
- **Type**: {issue_type}
- **Priority**: {priority}
- **URL**: {jira_base_url}/browse/{jira_key}

## Feature Description
{description from Jira - convert from ADF/HTML to markdown}

## User Story
{extract from description or generate based on context}
As a <type of user>
I want to <action/goal>
So that <benefit/value>

## Problem Statement
{extract from description or analyze based on context}

## Solution Statement
{propose solution based on codebase analysis}

## Relevant Files
{analyze codebase and list relevant files}

## Implementation Plan
### Phase 1: Foundation
{foundational work}

### Phase 2: Core Implementation
{main implementation}

### Phase 3: Integration
{integration with existing code}

## Step by Step Tasks
{detailed implementation steps}

## Testing Strategy
### Unit Tests
{unit tests needed}

### Integration Tests
{integration tests needed}

### Edge Cases
{edge cases to test}

## Acceptance Criteria
{from Jira or derived from description}

## Validation Commands
- `pnpm lint` - Run ESLint
- `pnpm cli typecheck` - TypeScript checking
- `pnpm cli build [app]` - Build affected app

## Notes
- Jira Key: {jira_key}
- Created from Jira at: {timestamp}
```

#### For Bugs:

```md
# Bug Fix: {summary}

## Jira Reference
- **Key**: {jira_key}
- **Type**: Bug
- **Priority**: {priority}
- **URL**: {jira_base_url}/browse/{jira_key}

## Bug Description
{description from Jira}

## Steps to Reproduce
{extract from description}

## Expected Behavior
{extract from description}

## Actual Behavior
{extract from description}

## Root Cause Analysis
{analyze codebase to identify root cause}

## Solution
{proposed fix}

## Relevant Files
{files likely involved in the bug}

## Implementation Plan
{step by step fix}

## Testing Strategy
{how to verify the fix}

## Validation Commands
- `pnpm lint`
- `pnpm cli typecheck`
- `pnpm test`

## Notes
- Jira Key: {jira_key}
```

#### For Tasks/Chores:

```md
# Task: {summary}

## Jira Reference
- **Key**: {jira_key}
- **Type**: {issue_type}
- **Priority**: {priority}
- **URL**: {jira_base_url}/browse/{jira_key}

## Task Description
{description from Jira}

## Implementation Plan
{direct implementation steps}

## Relevant Files
{files to modify}

## Validation Commands
- `pnpm lint`
- `pnpm cli typecheck`

## Notes
- Jira Key: {jira_key}
```

### 5. Research Codebase

Before finalizing the plan:
1. Read `README.md` for project overview
2. Check `docs/**` for architecture docs
3. Identify relevant packages/apps
4. Find existing patterns to follow
5. Check for similar implementations

## Output

After creating the plan, report:

```json
{
  "success": true,
  "jira_key": "{jira_key}",
  "issue_type": "{type}",
  "summary": "{summary}",
  "plan_file": ".ai/specs/{filename}.md",
  "worktree_name": "{jira_key_lowercase}",
  "workflow_type": "feature|bug|chore"
}
```

## Jira Key

$ARGUMENTS
