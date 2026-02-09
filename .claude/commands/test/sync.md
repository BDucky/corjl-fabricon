---
description: "Sync Unit Tests with Source Code. Args: [scope] (default: affected) - full|affected|apps|packages|<package-name>|<file-paths>"
---

# Sync Unit Tests with Source Code

Complete test workflow: **sync** tests with source code, **run** them, and **auto-resolve** failures.

## Workflow

```
/test:sync
    │
    ├─→ Phase 1: SYNC tests with source
    │       ├─ CREATE: new tests for new files
    │       ├─ UPDATE: update tests for modified files
    │       └─ DELETE: remove tests for deleted files
    │
    ├─→ Phase 2: RUN tests
    │       └─ Execute affected tests
    │
    └─→ Phase 3: RESOLVE failures (if any)
            └─ Auto-fix and retry (max 3 attempts)
```

## Goal

**Target: Tests always match source code AND pass**

This command ensures:
- New source files get new test files (CREATE)
- Modified source files get updated tests (UPDATE)
- Removed code gets tests cleaned up (DELETE)
- All tests pass after sync

## Arguments

Format: `[scope]` (optional)

| Argument | Description | Example |
|----------|-------------|---------|
| _(empty)_ | Sync changed files only (default) | `/test:sync` |
| `full`, `all` | Sync entire codebase | `/test:sync full` |
| `affected`, `changed` | Sync changed files only | `/test:sync affected` |
| `apps` | Sync all apps | `/test:sync apps` |
| `packages` | Sync all packages | `/test:sync packages` |
| `<package-name>` | Sync specific package/app | `/test:sync core` |
| `<file-paths>` | Sync specific file(s) | `/test:sync src/utils/foo.ts` |

### Available Package/App Names

| Name | Path |
|------|------|
| `core` | `packages/core/` |
| `editor` | `packages/editor/` |
| `plugins` | `packages/plugins/` |
| `extensions` | `packages/extensions/` |
| `designer` | `apps/designer/` |
| `auth` | `apps/auth/` |
| `enduser` | `apps/enduser/` |
| `demo` | `apps/demo/` |

## Variables

- **scope**: Extracted from $ARGUMENTS
- **base_branch**: Compare against `origin/dev` or from `.ai/agents/*/adw_state.json`
- **max_retry**: Maximum resolution attempts (default: 3)

## Instructions

### Phase 1: SYNC Tests with Source

#### Step 1.1: Determine Base Branch

```bash
# Check for ADW worktree state (when running in SDLC workflow)
state_file=$(ls .ai/agents/*/adw_state.json 2>/dev/null | head -1)
if [ -n "$state_file" ]; then
  base_branch=$(cat "$state_file" | jq -r '.worktree.base_branch // "origin/dev"')
else
  base_branch="origin/dev"
fi
```

#### Step 1.2: Get Changed Files with Status

```bash
# Get changed source files with their status (A=Added, M=Modified, D=Deleted)
git diff --name-status ${base_branch}...HEAD | grep -E '\.(ts|vue)$' | grep -v '\.spec\.' | grep -v '\.test\.' | grep -v '__tests__'
```

#### Step 1.3: Categorize and Process Files

For each changed file, determine action:

| Git Status | Action | Description |
|------------|--------|-------------|
| A (Added) | CREATE | Generate new test file |
| M (Modified) | UPDATE | Add/modify test cases |
| D (Deleted) | DELETE | Remove orphaned test file |

**Skip files:**
- `index.ts` - Barrel exports
- `*.d.ts`, `types.ts` - Type definitions
- `constants.ts` - Simple constants
- `*.config.ts` - Configuration
- `main.ts`, `App.vue` - Entry points

#### Step 1.4: Analyze Source Files

For files needing tests:
- Read the source file
- Identify exported functions/classes
- Determine dependencies to mock
- Compare with existing tests (if UPDATE)
- Plan test scenarios

#### Step 1.5: Generate Sync Report

Create report at `.ai/specs/{TIMESTAMP}-test-sync-report.md`:

```md
# Test Sync Report: {scope}

## Summary
- **Scope**: {scope}
- **Base Branch**: {base_branch}

### Actions
| Action | Files | Test Cases |
|--------|-------|------------|
| CREATE | {count} | {count} |
| UPDATE | {count} | +{added} / ~{modified} / -{removed} |
| DELETE | {count} | {count} |

## Files to Process

### CREATE: {file_path}
- **Test Location**: `__tests__/{name}.spec.ts`
- **Exports**: `func1`, `func2`
- **Test Scenarios**: [list]

### UPDATE: {file_path}
- **Changes**: [new functions, modified signatures]
- **Tests to Add**: [list]
- **Tests to Update**: [list]

### DELETE: {file_path}
- **Reason**: Source file deleted

## Step by Step Tasks
[Detailed implementation steps]
```

#### Step 1.6: Implement Sync

Invoke `/workflow:implement` with the sync report to:
- CREATE new test files
- UPDATE existing test files
- DELETE orphaned test files

---

### Phase 2: RUN Tests

#### Step 2.1: Run Affected Tests

```bash
pnpm cli test:affected
```

Or for specific scope:
```bash
# For package scope
pnpm test --filter @corjl/{package}

# For specific files
pnpm test -- {test-files}
```

#### Step 2.2: Capture Results

Parse test output to identify:
- Total tests run
- Passed tests
- Failed tests (with error details)

---

### Phase 3: RESOLVE Failures

If tests fail, attempt auto-resolution:

#### Step 3.1: Analyze Failure

For each failed test:
1. Extract error message and stack trace
2. Identify failure type:
   - **Assertion failure**: Test expectation not met
   - **Runtime error**: Code throws exception
   - **Timeout**: Async operation didn't complete
   - **Import error**: Module not found

#### Step 3.2: Determine Fix Strategy

| Failure Type | Strategy |
|--------------|----------|
| Assertion failure | Check if code or test is wrong |
| Runtime error | Fix the code bug |
| Timeout | Add proper async handling |
| Import error | Fix import paths or mocks |

**Priority**: Prefer fixing code over fixing tests (tests are usually correct)

#### Step 3.3: Implement Fix

Based on analysis:

**If code bug:**
```typescript
// Fix the implementation to match expected behavior
```

**If test bug:**
```typescript
// Fix test expectations or mock setup
```

**Common fixes:**

```typescript
// Async/Timing
await vi.waitFor(() => {
  expect(result).toBe(expected)
})

// Mock reset
beforeEach(() => {
  vi.clearAllMocks()
})

// Vue updates
await wrapper.vm.$nextTick()
```

#### Step 3.4: Retry

After fixing, re-run the failed test:
```bash
pnpm test -- {failed-test-file}
```

**Retry loop**: Maximum 3 attempts per failure.

#### Step 3.5: Report Resolution

Track resolution status:
- Tests fixed
- Tests still failing (require manual intervention)

---

## Test Templates

### Service Test
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

import { serviceFn } from '@/services/some.service';
import { apiClient } from '@/api/client';

describe('someService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('serviceFn', () => {
    it('should handle success case', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: expected });
      const result = await serviceFn('param');
      expect(result).toEqual(expected);
    });

    it('should handle error case', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed'));
      await expect(serviceFn('param')).rejects.toThrow('Failed');
    });
  });
});
```

### Composable Test
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/store/someStore', () => ({
  useSomeStore: vi.fn(() => ({ items: [], addItem: vi.fn() })),
}));

import { useComposable } from '@/composables/useComposable';

describe('useComposable', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should return reactive state', () => {
    const { state } = useComposable();
    expect(state.value).toBeDefined();
  });
});
```

### Store Test
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('@/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

import { useSomeStore } from '@/store/someStore';

describe('useSomeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should have correct initial state', () => {
    const store = useSomeStore();
    expect(store.items).toEqual([]);
  });
});
```

### Utility Test
```typescript
import { describe, it, expect } from 'vitest';
import { utilFn } from '@/utils/util';

describe('utilFn', () => {
  it('should handle valid input', () => {
    expect(utilFn('input')).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(utilFn('')).toBe('');
    expect(utilFn(null)).toBeNull();
  });
});
```

## Conventions

### Test File Location
- `src/services/cart.ts` → `src/__tests__/services/cart.spec.ts`
- `composables/useAuth.ts` → `__tests__/composables/useAuth.spec.ts`

### Naming
- Files: `{source-name}.spec.ts`
- Describe: Match module/class name
- It: Start with "should"

### Mocking
- Mock before imports: `vi.mock('@/store/...', () => ({...}))`
- Use `vi.mocked()` for type-safe access
- Clear mocks in `beforeEach`

## Report

Return JSON with complete workflow results:

```json
{
  "scope": "affected",
  "base_branch": "origin/dev",
  "sync": {
    "created": 2,
    "updated": 3,
    "deleted": 1,
    "files": ["list of processed files"]
  },
  "run": {
    "total": 45,
    "passed": 43,
    "failed": 2
  },
  "resolve": {
    "attempts": 2,
    "fixed": 2,
    "remaining": 0
  },
  "success": true,
  "summary": "All tests synced and passing"
}
```

## Usage Examples

```bash
# Most common: sync tests for changed files
/test:sync

# Sync specific package
/test:sync core
/test:sync designer

# Sync entire codebase (use carefully)
/test:sync full

# Sync specific files
/test:sync packages/core/services/cart.service.ts
```

## Notes

- This command handles the complete test workflow
- Phase 1 (SYNC) ensures tests match source code
- Phase 2 (RUN) verifies tests pass
- Phase 3 (RESOLVE) auto-fixes failures with retry
- Maximum 3 resolution attempts before reporting failure
- Manual intervention required if auto-resolve fails
