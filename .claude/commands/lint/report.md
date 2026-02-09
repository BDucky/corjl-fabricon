---
description: "Generate Lint Report. Args: [scope] [--format=md|json|summary] - Generate report without auto-fix"
---

# Generate Lint Report

Generate a comprehensive lint and TypeScript error report **without automatic fixing**. Use this to review code quality status before deciding on fixes.

## Purpose

This command provides visibility into code quality issues:
- Review lint errors before committing changes
- Generate reports for code review discussions
- Track technical debt over time
- Export reports in multiple formats

**Key difference from `/lint:resolve`**: This command only generates reports - it does NOT auto-fix errors.

## Arguments

Format: `[scope] [--format=<format>]`

| Argument | Description | Example |
|----------|-------------|---------|
| _(empty)_ | Report on changed files only | `/lint:report` |
| `full` | Report on entire codebase | `/lint:report full` |
| `affected` | Report on changed files only | `/lint:report affected` |
| `apps` | Report on all apps | `/lint:report apps` |
| `packages` | Report on all packages | `/lint:report packages` |
| `<package-name>` | Report on specific package | `/lint:report core` |
| `--format=md` | Markdown format (default) | `/lint:report --format=md` |
| `--format=json` | JSON format for automation | `/lint:report --format=json` |
| `--format=summary` | Brief summary only | `/lint:report --format=summary` |

## Variables

- **scope**: Extracted from $ARGUMENTS (default: `affected`)
- **format**: Output format - `md`, `json`, or `summary` (default: `md`)

## Instructions

### Step 1: Parse Arguments

Extract scope and format from $ARGUMENTS:
- If contains `--format=json` → format: json
- If contains `--format=summary` → format: summary
- Otherwise → format: md
- Remove format flag from remaining args to get scope

### Step 2: Generate Timestamp

```bash
TIMESTAMP=$(date +%y%m%d-%H%M%S)
```

### Step 3: Run Lint Check

Run appropriate lint command based on scope (without --fix):

| Scope | Command |
|-------|---------|
| full | `pnpm lint 2>&1` |
| affected | `pnpm cli lint:affected 2>&1` |
| apps | `pnpm lint:apps 2>&1` |
| packages | `pnpm lint:packages 2>&1` |
| `<package>` | `pnpm exec eslint packages/<package>/ 2>&1` |

### Step 4: Run TypeScript Check

| Scope | Command |
|-------|---------|
| full | `pnpm cli typecheck 2>&1` |
| affected | `pnpm cli typecheck:affected 2>&1` |
| `<package>` | `cd packages/<package> && pnpm exec vue-tsc --noEmit 2>&1` |

### Step 5: Parse and Categorize Errors

**ESLint Error Categories:**
- Import sorting (`simple-import-sort/imports`)
- Unused variables (`@typescript-eslint/no-unused-vars`)
- Explicit any (`@typescript-eslint/no-explicit-any`)
- Other rules (group by rule name)

**TypeScript Error Categories:**
- TS2322: Type assignment errors
- TS2741: Missing properties
- TS2339: Property not exist
- TS2345: Argument type errors
- TS2352: Type conversion errors
- Other TS codes

### Step 6: Generate Report

#### Format: Markdown (default)

Create file at `.ai/reports/{TIMESTAMP}-lint-report.md`:

```markdown
# Lint Report

## Overview
- **Scope**: {scope}
- **Generated**: {timestamp}
- **Status**: {PASS|FAIL}

## Summary
| Category | Count | Severity |
|----------|-------|----------|
| ESLint Errors | {count} | Error |
| ESLint Warnings | {count} | Warning |
| TypeScript Errors | {count} | Error |
| **Total Issues** | {total} | - |

## Files Affected
{count} files with issues

## ESLint Issues

### By Rule
| Rule | Count | Auto-fixable |
|------|-------|--------------|
| simple-import-sort/imports | {n} | Yes |
| @typescript-eslint/no-unused-vars | {n} | No |
| ... | ... | ... |

### By File
| File | Errors | Warnings |
|------|--------|----------|
| path/to/file.ts | {n} | {n} |

## TypeScript Issues

### By Error Code
| Code | Count | Description |
|------|-------|-------------|
| TS2322 | {n} | Type assignment |
| TS2339 | {n} | Property not exist |

### Detailed Errors
{List each error with file, line, message}

## Recommendations
- {Auto-generated recommendations based on error patterns}

## Next Steps
To fix these issues, run:
\`\`\`bash
/lint:resolve {scope}
\`\`\`
```

#### Format: JSON

Create file at `.ai/reports/{TIMESTAMP}-lint-report.json`:

```json
{
  "meta": {
    "scope": "affected",
    "timestamp": "2024-01-15T10:30:00Z",
    "status": "FAIL"
  },
  "summary": {
    "eslint_errors": 10,
    "eslint_warnings": 5,
    "typescript_errors": 3,
    "total": 18,
    "files_affected": 8
  },
  "eslint": {
    "by_rule": {
      "simple-import-sort/imports": { "count": 5, "fixable": true },
      "@typescript-eslint/no-unused-vars": { "count": 3, "fixable": false }
    },
    "errors": [
      {
        "file": "path/to/file.ts",
        "line": 10,
        "column": 5,
        "rule": "no-unused-vars",
        "message": "'foo' is defined but never used",
        "severity": "error"
      }
    ]
  },
  "typescript": {
    "by_code": {
      "TS2322": 2,
      "TS2339": 1
    },
    "errors": [
      {
        "file": "path/to/file.ts",
        "line": 25,
        "code": "TS2322",
        "message": "Type 'string' is not assignable to type 'number'"
      }
    ]
  }
}
```

#### Format: Summary

Output directly to console (no file):

```
Lint Report Summary
═══════════════════
Scope: affected
Status: FAIL

Issues Found:
  ESLint Errors:     10
  ESLint Warnings:    5
  TypeScript Errors:  3
  ─────────────────────
  Total:             18

Top Issues:
  1. simple-import-sort/imports (5 errors) - Auto-fixable
  2. @typescript-eslint/no-unused-vars (3 errors)
  3. TS2322 Type assignment (2 errors)

Files with most issues:
  1. packages/core/services/api.ts (5 issues)
  2. apps/designer/src/views/Editor.vue (4 issues)

Run '/lint:resolve' to fix these issues.
```

### Step 7: Output Result

- For `md` and `json` formats: Output the file path
- For `summary` format: Output the summary directly

## Report Location

Reports are saved to:
- Markdown: `.ai/reports/{TIMESTAMP}-lint-report.md`
- JSON: `.ai/reports/{TIMESTAMP}-lint-report.json`

## Usage Examples

```bash
# Quick summary of current issues
/lint:report --format=summary

# Full markdown report
/lint:report full

# JSON report for CI/automation
/lint:report affected --format=json

# Report for specific package
/lint:report core --format=md
```

## Integration

This report can be used with:
- `/lint:resolve` - To fix the reported issues
- `/workflow:review` - Include in code review
- CI/CD pipelines - JSON format for automation
