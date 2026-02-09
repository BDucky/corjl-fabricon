---
description: "Run autonomous lint/typecheck/test loop until clean"
---

# Validate Changes

Run the full validation loop autonomously until all checks pass. Do NOT ask the user to paste errors — read the output and fix issues yourself.

**Why this exists:** In past sessions, test/fix cycles consumed 15+ edits and 5+ test runs with the user manually driving each iteration. This command runs the loop autonomously.

## Instructions

Execute this loop (max 3 full iterations):

### Iteration
1. **Auto-fix lint**: `pnpm lint:affected --fix`
2. **Check lint**: `pnpm lint:affected`
   - If errors remain → read the output, fix the code, go to step 1
3. **Typecheck**: `pnpm typecheck:affected`
   - If errors → read the output, fix the code, go to step 1
4. **Test**: `pnpm test:affected`
   - If failures → read the FULL error output (do not truncate), analyze the root cause, fix the code, go to step 1

### On test failure analysis
- Read the failing test file to understand what it expects
- Read the source file to understand current behavior
- Fix the source OR the test (whichever is actually wrong)
- Common patterns:
  - Missing `await flushPromises()` for async component tests
  - Ref values needing `.value` access in assertions
  - Mock setup not matching actual function signatures
  - Import path changes not reflected in tests

### After 3 iterations
If issues remain, report them clearly:
```
Remaining issues after 3 iterations:
- [file:line] description of issue
```

### On success
```
Validation passed:
- lint: 0 errors, 0 warnings
- typecheck: clean
- test: X tests passed
- Files modified during validation: <list>
```

## Rules
- NEVER ask the user to paste errors or output
- NEVER use `--quiet` flag on lint — capture warnings too
- NEVER run full `pnpm lint` or `pnpm test` — always `:affected` variants
- Read error output completely before attempting fixes
- Batch independent tool calls (e.g., read test file + source file in parallel)

## Scope

$ARGUMENTS
