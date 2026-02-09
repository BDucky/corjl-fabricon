---
description: "Diagnose test failures before fixing. Args: <test command or file>"
---

# Diagnose Test Failures

Run failing tests, parse the output, classify root causes, then fix — in that order. Never guess at fixes without understanding the failure first.

**Why this exists:** In past sessions, test-fix cycles spiraled to 15 edits across 5 test runs because the agent guessed at fixes without properly diagnosing the root cause. This command enforces: diagnose FIRST, fix SECOND.

## Instructions

### Step 1: Run the failing test (1 call)
- Run the test command from `$ARGUMENTS`
- If no command given, run `pnpm test:affected`
- Capture the FULL output — do NOT truncate

### Step 2: Parse and classify failures (no tool calls — just think)
Categorize each failure into one of these root causes:
- **Ref unwrapping**: Test compares `ref()` object instead of `.value`
- **Async lifecycle**: Missing `await flushPromises()` or `await nextTick()` for `onMounted`/`watch`
- **Mock mismatch**: Mock setup doesn't match actual function signature or return type
- **Import change**: Source file moved/renamed but test still uses old path
- **Missing export**: Test accesses something not exposed by the component/composable
- **Logic error**: Actual bug in the source code (not test code)
- **Other**: Describe the root cause in 1 sentence

### Step 3: Report diagnosis before fixing
Print a summary:
```
Diagnosis:
- [test name]: <root cause category> — <1-sentence explanation>
- [test name]: <root cause category> — <1-sentence explanation>
```

### Step 4: Fix in priority order
Fix failures grouped by root cause (batch similar fixes):
1. Read the failing test file AND the source file in parallel
2. Fix ALL instances of the same root cause in one batch of edits
3. Run the test again
4. If new failures appear, go back to Step 2

### Step 5: Report
```
Fixed: <count> failures
Root causes: <list of categories found>
Test runs: <count>
```

## Rules
- NEVER edit code before completing Step 2 (diagnosis)
- NEVER run tests more than 4 times total
- Read the test file AND source file in parallel (not sequentially)
- Batch all edits for the same root cause category before re-running tests
- If you can't diagnose a failure, report it and ask the user — do NOT guess

## Test Command

$ARGUMENTS
