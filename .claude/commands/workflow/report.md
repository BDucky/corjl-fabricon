---
description: "Generate ADW Report"
---

# Generate ADW Report

Generate a comprehensive, reviewer-friendly report for the ADW workflow execution. Reports are automatically optimized to show only relevant changes, filtering out infrastructure noise.

## Purpose

Create a focused report that answers "What was done and why?" in 2-3 minutes:
1. **Plan** - What was planned, root cause (for bugs), implemented solution
2. **Process** - Phase execution status, git history
3. **Result** - Files changed (categorized), accurate statistics

## Key Features

- **File Categorization**: Separates core logic, tests, and infrastructure changes
- **Accurate Statistics**: Shows core changes separately from test/infrastructure changes
- **Type-Specific Sections**: Bugs get root cause analysis, features get use cases
- **Smart Filtering**: Excludes `.ai/`, `package.json`, config files from core statistics
- **Type-Specific Checklists**: Different review criteria for bugs, features, refactors

## Variables

- spec_file: $ARGUMENTS - Path to the spec file in `.ai/specs/`

## Instructions

### 1. Read the Spec File

Read the provided spec file to understand the original plan:
- Feature/Bug description
- Acceptance criteria
- Planned approach

### 2. Analyze Execution

Gather information about what happened:
- Git commits made
- Files changed
- Tests run
- Build/lint results

Use git commands:
```bash
git log --oneline origin/dev..HEAD
git diff origin/dev --stat
```

### 3. Generate Report

Create a markdown file at `.ai/reports/{issue_key}-report.md` with the following structure:

```markdown
---
issue_key: COR-123
title: Report Title
type: bug|feature|chore|refactor
source: jira|sentry
created_at: 2025-01-10T14:30:00Z
generated_by: adw_report
---

# ADW Report: {Issue Key}

## Summary

| Field | Value |
|-------|-------|
| Type | Bug/Feature/Chore/Refactor |
| Source | Jira/Sentry |
| Branch | feature/cor-123-... |
| Commits | 5 |
| Files Changed | 2 core + 3 test files |
| Lines | +15 / -10 (core logic) |

## Plan

### Original Request
<Brief description from spec file>

### Root Cause
<For bugs only: What caused the issue>

### Implemented Solution
<What was done to fix/implement>

## Process

### Phase Execution

| Phase | Status | Notes |
|-------|--------|-------|
| Plan | ✓ Completed | Created spec in `.ai/specs/` |
| Build | ✓ Completed | 2 files modified, 3 test files added |
| Test | ✓ Completed | All tests passing |
| Review | ○ Pending |  |
| Report | ✓ Completed |  |
| Ship | ○ Pending |  |

### Git History

```
abc1234 fix: resolve edge case
def5678 feat: implement main logic
ghi9012 test: add unit tests
```

## Result

### Files Changed (Core Logic)

| File | Change | Lines |
|------|--------|-------|
| `packages/editor/helpers/foo.ts` | Modified | +10 / -5 |
| `apps/designer/components/Bar.vue` | Modified | +5 / -5 |

### Files Changed (Tests)

| File | Change | Lines |
|------|--------|-------|
| `packages/editor/helpers/__tests__/foo.test.ts` | Added | +120 |
| `apps/designer/components/__tests__/Bar.spec.ts` | Added | +85 |

### Statistics

**Core Logic Changes:**
- **Files changed:** 2
- **Lines added:** 15
- **Lines removed:** 10
- **Net change:** +5 lines

**Total Changes (including tests):**
- **Files changed:** 5
- **Lines added:** 220
- **Lines removed:** 10
- **Net change:** +210 lines

## Review Checklist

For bugs:
- [ ] Null safety checks properly handle edge cases
- [ ] Type definitions match actual usage
- [ ] No regression in related functionality
- [ ] Tests cover the edge case that caused the bug
- [ ] Error logging/handling is appropriate
- [ ] No other similar unsafe patterns in the codebase

For features:
- [ ] Feature works as expected in all scenarios
- [ ] UX is intuitive and follows design guidelines
- [ ] Performance is acceptable (no noticeable lag)
- [ ] Accessibility requirements are met
- [ ] Error handling covers edge cases
- [ ] Documentation is updated
- [ ] Tests cover main use cases

## Links

- **Spec**: `.ai/specs/{spec-file}.md`
- **Jira/Sentry**: [Link to issue]
- **Worktree**: `/path/to/worktree`

---

**Note**: This report focuses on the bug fix changes. 5 infrastructure/config files were also modified but excluded from statistics.
```

### 4. Validate Report

Ensure:
- [ ] All phases are documented
- [ ] Git history is accurate
- [ ] Validation results are current
- [ ] Links are valid

## Report

Return the path to the generated report file:

```
.ai/reports/{issue_key}-report.md
```

## Notes

- Report is generated after all phases complete (before ship)
- Focus on information useful for code review
- Include both successes and any issues encountered
- Be honest about any limitations or known issues
