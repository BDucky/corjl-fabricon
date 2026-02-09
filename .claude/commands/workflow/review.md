---
description: "Review"
---

# Review

Review implementation against a specification file to ensure code changes match requirements. Use git diff to understand changes and the spec file to validate requirements. Capture screenshots of critical functionality using Playwright MCP.

**NOTE**: This review phase does NOT perform lint/typecheck validation. Validation was already completed in the Build phase (`/workflow:implement`). This phase focuses solely on:
- Code quality review
- Spec compliance verification
- UI validation (if applicable)

### CRITICAL: What NOT to run
**DO NOT run these commands - they were already handled:**
- `pnpm lint` or `pnpm cli lint:affected` - done in Build phase
- `pnpm cli typecheck` or `pnpm cli typecheck:affected` - done in Build phase
- `pnpm test` or `pnpm cli test:affected` - done in Test phase
- `pnpm cli build designer` or any build commands - not required

## Variables

- spec_file: $ARGUMENTS (path to spec file in `.ai/specs/`)

## Instructions

### 1. Understand Context
- Check current git branch: `git branch --show-current`
- Get changes summary: `git diff origin/dev --stat`
- If `$ARGUMENTS` is provided, use it as the spec file path
- If no spec file provided, look for recent specs in `.ai/specs/` matching the branch name

### 2. Read Specification
- Read the spec file from `.ai/specs/`
- Understand the requirements, acceptance criteria, and validation commands
- Note the testing strategy and edge cases

### 3. Review Code Changes
- Run `git diff origin/dev` to see all code changes
- For each changed file:
  - Verify changes align with spec requirements
  - Check for missing implementations
  - Look for potential bugs or issues
  - Verify coding standards are followed (Vue 3 Composition API, TypeScript, Pinia)

### 4. UI Validation (optional - skip for automation)
If running interactively AND the spec involves UI changes, validate visually using Playwright MCP:

**Note**: Skip this step if running in automated mode or if no UI changes are involved.

1. Navigate to `http://localhost:3000`
2. Login with provided credentials (ask user if needed)
3. Navigate to the feature area and capture screenshots of critical paths
4. Take 1-5 screenshots showcasing the new functionality
5. Use descriptive filenames: `01_feature_name.png`, `02_feature_name.png`, etc.

### 5. Issue Severity Guidelines
- `skippable` - Non-blocking issue, minor improvements suggested
- `tech_debt` - Non-blocking but creates technical debt for future
- `blocker` - Must fix before release, affects functionality or UX

## App Routes Reference

| App | Route | Description |
|-----|-------|-------------|
| Auth | `/:lang/auth` (e.g., `/en/auth`) | Authentication & login |
| Designer | `/:lang/app` (e.g., `/en/app`) | Main design tool |
| Enduser | `/:lang/c` (e.g., `/en/c`) | Customer-facing app |
| Demo | `/d` | SSR demo application |

**Base URL**: `http://localhost:3000` (via local-dev-proxy)

## Report

Return ONLY valid JSON (no markdown, no explanation):

```json
{
    "success": true,
    "review_summary": "2-4 sentences describing what was built and whether it matches the spec. Written as a standup report.",
    "spec_file": "/path/to/.ai/specs/spec-file.md",
    "files_changed": ["list", "of", "changed", "files"],
    "review_issues": [
        {
            "issue_number": 1,
            "file": "path/to/file.ts",
            "line": 42,
            "issue_description": "Description of the issue",
            "issue_resolution": "How to fix it",
            "issue_severity": "skippable|tech_debt|blocker"
        }
    ],
    "acceptance_criteria_met": [
        {"criteria": "Criteria from spec", "met": true, "notes": "Optional notes"}
    ],
    "screenshots": [
        "/absolute/path/to/screenshot.png"
    ]
}
```

### Output Rules
- `success`: `true` if NO BLOCKING issues exist
- `success`: `false` if ANY BLOCKING issues exist
- Include all issues found (any severity)
- JSON must be valid and parseable with `JSON.parse()`

## Spec File

$ARGUMENTS
