---
description: "Resolve Lint/TypeScript Issues. Args: [scope] (default: affected) - full|affected|apps|packages|<package-name>|<file-paths>"
---

# Resolve Lint/TypeScript Issues

Detect, report, and fix **ALL** ESLint and TypeScript issues - both **errors AND warnings**. The goal is a completely clean codebase with zero lint/type issues.

## Goal: Clean Codebase

**Target: 0 errors AND 0 warnings**

This command ensures:
- No ESLint errors
- No ESLint warnings
- No TypeScript errors
- No TypeScript warnings

## Capabilities

This command handles ALL severity levels:

**ESLint Issues (Errors & Warnings):**
- Import sorting (`simple-import-sort/imports`)
- Unused variables (`@typescript-eslint/no-unused-vars`)
- Explicit any (`@typescript-eslint/no-explicit-any`)
- No console (`no-console`) - often warning
- Prefer const (`prefer-const`)
- Member delimiter style, etc.

**TypeScript Issues (Errors & Warnings):**
- Type assignment errors (TS2322)
- Missing properties (TS2741)
- Property not exist (TS2339)
- Argument type errors (TS2345)
- Type conversion errors (TS2352)
- Expression not callable (TS2349)
- Implicit any warnings
- Unused locals/parameters warnings
- And more...

## Purpose

This command supports two workflows:

### Workflow 1: Auto-Fix (default)
1. Run lint AND typecheck with specified scope
2. Parse and categorize ALL ESLint and TypeScript issues (errors + warnings)
3. Generate comprehensive report in `.ai/specs/` folder
4. **Automatically invoke `/workflow:implement`** to fix all issues

### Workflow 2: Direct Fix (legacy)
1. Receive error/warning output as input
2. Parse and fix issues directly
3. Verify fixes

## Arguments

Format: `[scope]` (optional)

| Argument | Description | Example |
|----------|-------------|---------|
| _(empty)_ | Lint changed files only (default) | `/lint:resolve` |
| `full`, `all` | Lint entire codebase | `/lint:resolve full` |
| `affected`, `changed` | Lint changed files only | `/lint:resolve affected` |
| `apps` | Lint all apps (designer, auth, enduser, demo) | `/lint:resolve apps` |
| `packages` | Lint all packages (core, editor, plugins, extensions) | `/lint:resolve packages` |
| `<package-name>` | Lint specific package/app | `/lint:resolve core` |
| `<file-paths>` | Lint specific file(s) | `/lint:resolve src/utils/foo.ts` |
| `<error-output>` | Direct error output for immediate fix (legacy) | `/lint:resolve <paste errors>` |

### Available Package/App Names

Use package/app names from the project structure: `core`, `editor`, `plugins`, `extensions`, `designer`, `auth`, `enduser`, `demo`.

## Variables

- **scope**: Extracted from $ARGUMENTS (see table above)
- **output_mode**: How to handle results
  - `report` - Generate report file (default for scope modes)
  - `fix` - Fix issues directly (default for error-output mode)

## Scope Detection

Parse $ARGUMENTS to determine scope and output_mode:

### Detection Rules (in order)

1. **Empty/No arguments** → scope: `affected`, output_mode: `report`

2. **Keyword arguments**:
   | Keyword | Scope | Output Mode |
   |---------|-------|-------------|
   | `full`, `all` | full | report |
   | `affected`, `changed` | affected | report |
   | `apps` | apps | report |
   | `packages` | packages | report |

3. **Package/App name**:
   | Name | Lint Path |
   |------|-----------|
   | `core` | `packages/core/` |
   | `editor` | `packages/editor/` |
   | `plugins` | `packages/plugins/` |
   | `extensions` | `packages/extensions/` |
   | `designer` | `apps/designer/` |
   | `auth` | `apps/auth/` |
   | `enduser` | `apps/enduser/` |
   | `demo` | `apps/demo/` |

4. **File path(s)** → Detected by: contains `/` or `\`, or ends with `.ts`, `.tsx`, `.vue`, `.js`

5. **Error output** → Detected by: contains `error`, `warning`, `✖`, `ESLint`, `typescript-eslint`, or line:column format `(10:5)`
   - output_mode: `fix` (direct fix mode)

## Lint Commands Reference

| Scope | Command |
|-------|---------|
| full | `pnpm lint` |
| affected | `pnpm cli lint:affected` |
| apps | `pnpm lint:apps` |
| packages | `pnpm lint:packages` |
| `<package>` | `pnpm exec eslint packages/<package>/` or `apps/<package>/` |
| `<files>` | `pnpm exec eslint <file1> <file2> ...` |

## Typecheck Commands Reference

| Scope | Command |
|-------|---------|
| full | `pnpm cli typecheck` |
| affected | `pnpm cli typecheck:affected` |
| `<package>` | `cd packages/<package> && pnpm exec tsc --noEmit` |

## Instructions

### Mode A: Report Mode (scope-based)

When $ARGUMENTS is a scope keyword or empty:

#### Step 1: Generate Timestamp
```bash
date +%y%m%d-%H%M%S
```

#### Step 2: Run Lint (capture ALL issues - errors AND warnings)
Run the appropriate lint command based on scope:
```bash
# Example for affected scope - capture both errors and warnings
pnpm cli lint:affected 2>&1 | tee /tmp/lint-output.txt
```

**IMPORTANT:** Do NOT use `--quiet` flag - we need to capture warnings too!

#### Step 3: Run Typecheck
```bash
# Example for affected scope
pnpm cli typecheck:affected 2>&1 | tee /tmp/typecheck-output.txt
```

#### Step 4: Parse ALL Issues (Errors AND Warnings)

Categorize by severity AND type:

**ESLint Errors (severity: error):**
- Import sorting: `simple-import-sort/imports`
- Unused variables: `@typescript-eslint/no-unused-vars`
- Explicit any: `@typescript-eslint/no-explicit-any`
- Member delimiter style: `@typescript-eslint/member-delimiter-style`
- Other ESLint rules: Group by rule name

**ESLint Warnings (severity: warning):**
- No console: `no-console`
- Prefer const: `prefer-const`
- Max lines per function: `max-lines-per-function`
- Complexity: `complexity`
- Other warning-level rules

**TypeScript Errors (TS codes):**
- Type assignment errors (TS2322)
- Missing properties (TS2741)
- Property not exist (TS2339)
- Argument type errors (TS2345)
- Type conversion errors (TS2352)
- Not callable (TS2349)
- Enum errors
- Other TypeScript errors

**TypeScript Warnings:**
- Implicit any in certain contexts
- Unused locals (when configured as warning)
- Other TS warnings

#### Step 5: Generate Report File
Create report at `.ai/specs/{TIMESTAMP}-lint-report.md`:

```md
# Lint Report: {scope}

## Summary
- **Scope**: {scope}
- **Generated**: {timestamp}
- **Target**: 0 errors, 0 warnings (clean codebase)

### Current Status
| Type | Errors | Warnings | Total |
|------|--------|----------|-------|
| ESLint | {count} | {count} | {count} |
| TypeScript | {count} | {count} | {count} |
| **Total** | **{count}** | **{count}** | **{count}** |

### Files Affected: {count}

## ESLint Errors

### Import Sorting ({count})
| File | Line | Issue |
|------|------|-------|
| path/to/file.ts | 10 | Combine type and value imports |

### Relative Imports - Should Use Aliases ({count})
| File | Line | Current Import | Should Be |
|------|------|----------------|-----------|
| path/to/file.ts | 5 | `../../packages/core/utils` | `@corjl/core/utils` |

### Unused Variables ({count})
| File | Line | Variable | Suggested Action |
|------|------|----------|------------------|
| path/to/file.ts | 25 | `unusedVar` | Remove or prefix with `_` |

### Explicit Any ({count})
| File | Line | Context | Suggested Type |
|------|------|---------|----------------|
| path/to/file.ts | 30 | function param | `Record<string, unknown>` |

### Other ESLint Errors ({count})
| File | Line | Rule | Message |
|------|------|------|---------|
| path/to/file.ts | 40 | rule-name | Error message |

## ESLint Warnings

### Console Statements ({count})
| File | Line | Statement | Action |
|------|------|-----------|--------|
| path/to/file.ts | 15 | console.log | Remove or use logger |

### Prefer Const ({count})
| File | Line | Variable | Action |
|------|------|----------|--------|
| path/to/file.ts | 20 | `myVar` | Change `let` to `const` |

### Complexity Warnings ({count})
| File | Line | Function | Complexity | Max |
|------|------|----------|------------|-----|
| path/to/file.ts | 50 | `processData` | 15 | 10 |

### Other ESLint Warnings ({count})
| File | Line | Rule | Message |
|------|------|------|---------|
| path/to/file.ts | 60 | rule-name | Warning message |

## TypeScript Errors

### Type Assignment Errors - TS2322 ({count})
| File | Line | Error | Fix Strategy |
|------|------|-------|--------------|
| path/to/file.ts | 30 | Type '"ACTIVE"' is not assignable to type 'OrgStatus' | Use enum value instead of string literal |

### Missing Properties - TS2741 ({count})
| File | Line | Missing Property | Required Type |
|------|------|------------------|---------------|
| path/to/file.ts | 25 | `orgId` | `ItemSetInfo` |

### Property Not Exist - TS2339 ({count})
| File | Line | Property | On Type | Fix Strategy |
|------|------|----------|---------|--------------|
| path/to/file.ts | 50 | `visible` | `unknown` | Add type assertion or proper typing |

### Argument Type Errors - TS2345 ({count})
| File | Line | Error | Fix Strategy |
|------|------|-------|--------------|
| path/to/file.ts | 60 | Argument of type 'X' is not assignable | Update argument or add type assertion |

### Type Conversion Errors - TS2352 ({count})
| File | Line | Error | Fix Strategy |
|------|------|-------|--------------|
| path/to/file.ts | 70 | Conversion may be a mistake | Cast through `unknown` first |

### Other TypeScript Errors ({count})
| File | Line | TS Code | Error |
|------|------|---------|-------|
| path/to/file.ts | 80 | TS2349 | This expression is not callable |

## TypeScript Warnings ({count})

| File | Line | Code | Warning | Fix Strategy |
|------|------|------|---------|--------------|
| path/to/file.ts | 90 | TS7006 | Parameter implicitly has 'any' type | Add type annotation |

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom. Fix ALL issues - both errors AND warnings.

### Step 1: Fix Import Sorting Errors
- Read each file listed in Import Sorting section
- Combine type and value imports from same module
- Files: {list files}

### Step 1.5: Fix Relative Imports (Use Aliases)
- Read each file listed in Relative Imports section
- Replace relative paths with appropriate aliases:
  - `../../packages/core/...` → `@corjl/core/...`
  - `../../packages/editor/...` → `@corjl/editor/...`
  - `../../packages/extensions/...` → `@corjl/extensions/...`
  - `../../packages/plugins/...` → `@corjl/plugins/...`
- Files: {list files}

### Step 2: Fix Unused Variables
- Read each file listed in Unused Variables section
- Remove unused variables or prefix with `_` if intentional
- Files: {list files}

### Step 3: Fix Explicit Any
- Read each file listed in Explicit Any section
- Replace `any` with proper types or `unknown`
- Files: {list files}

### Step 4: Fix Other ESLint Errors
- Read each file listed in Other ESLint Errors section
- Apply fixes according to ESLint rule suggestions
- Files: {list files}

### Step 5: Fix Console Statements (Warnings)
- Read each file listed in Console Statements section
- Remove console.log/warn/error or replace with proper logger
- If debug logging is intentional, add eslint-disable with documentation
- Files: {list files}

### Step 6: Fix Prefer Const (Warnings)
- Read each file listed in Prefer Const section
- Change `let` to `const` where variable is never reassigned
- Files: {list files}

### Step 7: Fix Complexity Warnings
- Read each file listed in Complexity Warnings section
- Refactor complex functions into smaller, focused functions
- Extract helper functions to reduce cyclomatic complexity
- Files: {list files}

### Step 8: Fix Other ESLint Warnings
- Read each file listed in Other ESLint Warnings section
- Apply fixes according to ESLint rule suggestions
- Files: {list files}

### Step 9: Fix TypeScript Type Assignment Errors (TS2322)
- Read each file listed in Type Assignment Errors section
- Common fixes:
  - Use enum values instead of string literals: `OrgStatus.ACTIVE` instead of `'ACTIVE'`
  - Add proper type annotations
  - Use type assertions where appropriate
- Files: {list files}

### Step 10: Fix TypeScript Missing Properties (TS2741)
- Read each file listed in Missing Properties section
- Add missing required properties to object literals
- Check the interface/type definition for all required properties
- Files: {list files}

### Step 11: Fix TypeScript Property Not Exist (TS2339)
- Read each file listed in Property Not Exist section
- Common fixes:
  - Add type assertion: `(obj as SomeType).property`
  - Use optional chaining: `obj?.property`
  - Fix the base type to include the property
- Files: {list files}

### Step 12: Fix TypeScript Argument Type Errors (TS2345)
- Read each file listed in Argument Type Errors section
- Common fixes:
  - Update the argument to match expected type
  - Add type assertion if type is compatible
  - Fix the function signature if appropriate
- Files: {list files}

### Step 13: Fix TypeScript Type Conversion Errors (TS2352)
- Read each file listed in Type Conversion Errors section
- Use double assertion through `unknown`: `value as unknown as TargetType`
- Or fix the source type to be compatible
- Files: {list files}

### Step 14: Fix Other TypeScript Errors
- Read each file listed in Other TypeScript Errors section
- Apply fixes based on specific TS error code
- Files: {list files}

### Step 15: Fix TypeScript Warnings
- Read each file listed in TypeScript Warnings section
- Add missing type annotations for implicit any
- Address unused variable warnings
- Files: {list files}

### Step 16: Verify Clean Codebase
Run validation and ensure ZERO issues:
```bash
pnpm cli lint:affected
pnpm cli typecheck:affected
```

**Expected output:** No errors AND no warnings.

## Fix Patterns Reference

### Import Sorting
\`\`\`typescript
// Before
import { foo } from './module'
import type { FooType } from './module'

// After
import { foo, type FooType } from './module'
\`\`\`

### Unused Variables
\`\`\`typescript
// Option 1: Remove
// Option 2: Prefix with underscore
const _unused = getValue()
\`\`\`

### Console Statements (Warnings)
\`\`\`typescript
// Before
console.log('debug info')

// After - Option 1: Remove entirely
// After - Option 2: Use proper logger
logger.debug('debug info')

// After - Option 3: If intentional, document it
// eslint-disable-next-line no-console -- Required for user-facing error message
console.error('Fatal error:', error)
\`\`\`

## Validation Commands
Validation will be handled by the Test phase. No commands needed here.
```

#### Step 6: Auto-Execute Implementation
After generating the report, automatically execute the implementation workflow:

1. Output: `Report generated: .ai/specs/{TIMESTAMP}-lint-report.md`
2. Output: `Proceeding to fix all issues (errors + warnings)...`
3. **Invoke the Skill tool** with:
   - `skill: "workflow:implement"`
   - `args: ".ai/specs/{TIMESTAMP}-lint-report.md"`

This will automatically fix all issues without requiring user intervention.

### Mode B: Direct Fix Mode (error-output)

When $ARGUMENTS contains error output:

#### Step 1: Parse Output
Identify ALL issue types from the output (errors AND warnings).

#### Step 2: Apply Fixes
Use the fix patterns in "Common Fix Patterns" section.

#### Step 3: Verify
Re-run the original command to confirm ALL issues are resolved.

#### Step 4: Report
Provide summary of fixes applied:
- Errors fixed
- Warnings fixed
- Files modified
- Any remaining issues

## Common Fix Patterns

### Import Sorting (simple-import-sort/imports)
```typescript
// Before - separate imports
import { foo } from './module'
import type { FooType } from './module'

// After - combined
import { foo, type FooType } from './module'
```

### Unused Variables (@typescript-eslint/no-unused-vars)
```typescript
// Before
const unused = getValue()

// After - Option 1: Remove the line entirely
// After - Option 2: Prefix with underscore (if intentionally unused)
const _unused = getValue()
```

### Explicit Any (@typescript-eslint/no-explicit-any)
```typescript
// Before
function process(data: any) { ... }

// After
function process(data: Record<string, unknown>) { ... }
// or use specific type
function process(data: UserData) { ... }
```

### Prefer Const (prefer-const) - WARNING
```typescript
// Before
let value = 'constant'

// After
const value = 'constant'
```

### No Console (no-console) - WARNING
```typescript
// Before
console.log('debug')

// After - Option 1: Remove
// After - Option 2: Use logger
import { logger } from '@/utils/logger'
logger.debug('debug')

// After - Option 3: If intentional, document
// eslint-disable-next-line no-console -- User-facing error output
console.error('Failed to save')
```

### Missing Return Type
```typescript
// Before
function getData() { return { foo: 1 } }

// After
function getData(): { foo: number } { return { foo: 1 } }
```

## TypeScript Fix Patterns

### TS2322: Type Assignment - Enum Values
```typescript
// Before - Using string literal
status: 'ACTIVE'  // ❌ Type '"ACTIVE"' is not assignable to type 'OrgStatus'

// After - Use enum value
import { OrgStatus } from './types'
status: OrgStatus.ACTIVE  // ✅
```

### TS2741: Missing Property
```typescript
// Before - Missing required property
const item: ItemSetInfo = {
  setId: 'set-1',
  name: 'Test',
  // ❌ Property 'orgId' is missing
}

// After - Add missing property
const item: ItemSetInfo = {
  setId: 'set-1',
  name: 'Test',
  orgId: 'org-123',  // ✅ Added
}
```

### TS2339: Property Not Exist
```typescript
// Before
wrapper.props('visible')  // ❌ Property 'visible' does not exist on type 'unknown'

// After - Option 1: Type assertion
(wrapper.props() as { visible: boolean }).visible  // ✅

// After - Option 2: Record type
(wrapper.props() as Record<string, unknown>).visible  // ✅
```

### TS2345: Argument Type Error
```typescript
// Before
expect(wrapper.props('visible'))  // ❌ Argument of type '"visible"' is not assignable

// After - Access via props() object
expect((wrapper.props() as Record<string, unknown>).visible)  // ✅
```

### TS2352: Type Conversion Error
```typescript
// Before
const cart = mockData as CartNewMeta  // ❌ Conversion may be a mistake

// After - Double assertion through unknown
const cart = mockData as unknown as CartNewMeta  // ✅
```

### TS2349: Expression Not Callable
```typescript
// Before
store.someAction()  // ❌ This expression is not callable

// After - Check if it's a computed or method
// If computed property:
store.someAction  // Remove parentheses

// If method, check store definition:
const store = useSomeStore()
await store.someAction()  // Ensure proper store initialization
```

### TS7006: Implicit Any (Warning)
```typescript
// Before - Parameter implicitly has 'any' type
function process(data) { ... }  // ⚠️ Warning

// After - Add explicit type
function process(data: ProcessData) { ... }  // ✅
```

### Vue Test Utils - wrapper.props() Type Issues
```typescript
// Pattern 1: Type the entire props object
interface ComponentProps {
  visible: boolean
  value: string
  config: object
}
const props = wrapper.props() as ComponentProps
expect(props.visible).toBe(true)

// Pattern 2: Use Record for dynamic access
expect((wrapper.props() as Record<string, unknown>)['visible']).toBe(true)

// Pattern 3: Use wrapper.vm for component instance
expect((wrapper.vm as any).visible).toBe(true)
```

### Test File - Mock Data Type Fixes
```typescript
// When mock data doesn't match interface exactly:

// Option 1: Add all required properties
const mockData: InterfaceType = {
  requiredProp1: 'value',
  requiredProp2: 123,
  // ... all required props
}

// Option 2: Partial mock with type assertion
const mockData = {
  onlyNeededProp: 'value',
} as unknown as InterfaceType

// Option 3: Use Partial<T> if interface allows
const mockData: Partial<InterfaceType> = {
  onlyNeededProp: 'value',
}
```

## Usage Examples

### Auto-Fix Mode (default)
```bash
# Lint changed files, generate report, and auto-fix ALL issues
/lint:resolve

# Lint entire codebase and auto-fix ALL issues
/lint:resolve full

# Lint specific package and auto-fix ALL issues
/lint:resolve core
/lint:resolve designer
```

The command will:
1. Run lint/typecheck
2. Generate report in `.ai/specs/` (including both errors AND warnings)
3. Automatically invoke `/workflow:implement` to fix ALL issues

### Direct Fix (legacy mode)
```bash
# Paste error/warning output directly
/lint:resolve <error output from terminal>
```

## Report

After fixing, report:
- Errors fixed: {count}
- Warnings fixed: {count}
- Files modified: {count}
- Remaining issues: {count} (should be 0)

**Success criteria:** Clean codebase with 0 errors AND 0 warnings.
