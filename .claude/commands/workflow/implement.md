---
description: "Implement the following plan"
---

# Implement the following plan
Follow the `Instructions` to implement the `Plan` then `Report` the completed work.

## Instructions
- The `$ARGUMENTS` is a file path to a plan in `.ai/specs/` folder. Read this file first.
- Use TodoWrite to track progress through each step.
- Execute each step in the `Step by Step Tasks` section in order, top to bottom.
- **IMPORTANT**: After making code changes, run `pnpm lint:affected --fix` to auto-fix ESLint issues.
- DO NOT skip any steps.

### CRITICAL: What NOT to run
**DO NOT run these commands - they are handled by other phases:**
- `pnpm test` or `pnpm test:affected` - handled by Test phase
- `pnpm build` or any build commands - not required
- Full `pnpm lint` - use `lint:affected` instead

## Code Quality Requirements

After implementing changes, you MUST ensure **zero ESLint errors, zero ESLint warnings, and zero TypeScript errors** for all modified files.

**Target: 0 errors + 0 warnings** - A completely clean codebase.

**IMPORTANT**: This Build phase is the ONLY phase in the SDLC pipeline that performs lint/typecheck validation. Subsequent phases (Test, Review, Ship) trust this validation and do NOT re-run it. This single-validation-pass pattern ensures:
- Faster pipeline execution by eliminating redundant checks
- Consistent validation results across all phases
- Fail-fast behavior that catches errors immediately after implementation

### Validation (Single Pass - Fail Fast with Recovery)

Execute in order:

1. **Auto-fix**: `pnpm lint:affected --fix`

2. **Check lint (errors + warnings)**: `pnpm lint:affected`
   - Do NOT use `--quiet` - capture warnings too!

3. **Fix remaining ESLint issues** using Quick Reference table below

4. **Typecheck**: `pnpm typecheck:affected`

5. **Fix TypeScript errors** using Quick Reference table below

6. **Final validation**: Re-run both lint and typecheck

7. **If issues remain**: STOP and report with file paths and error messages

### Quick Reference - Common Fixes

See `ai-docs/conventions/linting.md` for ESLint and TypeScript quick fix tables.

For comprehensive fix patterns with examples, see the `/lint:resolve` command documentation.

### Rules

- **Fail Fast**: Stop and report if validation fails
- **One Retry**: Each step gets ONE fix attempt
- **Target**: 0 errors AND 0 warnings

## Plan
$ARGUMENTS

## Commit Changes
After implementation is complete and all validations pass:
- Stage all changes: `git add -A`
- Do NOT commit - the Ship phase will handle committing

## Report
- Summarize the work you've just done in a concise bullet point list.
- Report the files and total lines changed with `git diff --stat`