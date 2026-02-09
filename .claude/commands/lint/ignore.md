---
description: "Manage Lint/TS Ignores. Args: [audit|cleanup|add] [--type=all|eslint|ts] - Audit and manage eslint-disable and @ts-ignore comments"
---

# Manage Lint & TypeScript Ignores

Audit, analyze, and manage `eslint-disable` and `@ts-ignore` comments throughout the codebase. Keep suppressions intentional and documented.

## Purpose

This command helps maintain ignore hygiene for both ESLint and TypeScript:
- Find all eslint-disable and @ts-ignore comments in codebase
- Identify outdated or unnecessary ignores
- Detect overly broad suppressions
- Ensure ignores are documented
- Clean up stale ignores

## Arguments

Format: `[mode] [options]`

| Argument | Description | Example |
|----------|-------------|---------|
| _(empty)_ | Same as `audit` | `/lint:ignore` |
| `audit` | Full audit of all ignores | `/lint:ignore audit` |
| `cleanup` | Remove unnecessary ignores | `/lint:ignore cleanup` |
| `add` | Add ignore with documentation | `/lint:ignore add` |
| `--scope=<path>` | Limit to specific path | `/lint:ignore audit --scope=packages/core` |
| `--rule=<rule>` | Filter by rule | `/lint:ignore --rule=no-explicit-any` |
| `--type=<type>` | Filter by type: `all`, `eslint`, `ts` (default: all) | `/lint:ignore --type=ts` |

## Variables

- **mode**: `audit`, `cleanup`, or `add` (default: audit)
- **scope**: Path to limit analysis (optional)
- **rule_filter**: Specific rule to filter (optional)
- **type_filter**: `all`, `eslint`, or `ts` (default: all)

## Instructions

### Mode: Audit (default)

#### Step 1: Find All Ignores

Search for both ESLint and TypeScript ignore patterns:

```bash
# Find all eslint-disable comments
grep -rn "eslint-disable" --include="*.ts" --include="*.vue" --include="*.js" --include="*.tsx" --include="*.jsx" . | grep -v node_modules | grep -v .nuxt | grep -v dist/

# Find all TypeScript ignore comments
grep -rn "@ts-ignore\|@ts-expect-error\|@ts-nocheck" --include="*.ts" --include="*.vue" --include="*.tsx" . | grep -v node_modules | grep -v .nuxt | grep -v dist/
```

#### ESLint Patterns to find:
- `// eslint-disable-next-line`
- `/* eslint-disable */`
- `/* eslint-disable rule-name */`
- `// eslint-disable-line`

#### TypeScript Patterns to find:
- `// @ts-ignore` - Suppresses error on next line (deprecated, prefer @ts-expect-error)
- `// @ts-expect-error` - Suppresses error on next line, fails if no error exists
- `// @ts-nocheck` - Disables type checking for entire file

#### Step 2: Categorize Ignores

**ESLint Categories:**

**1. File-level disables** (entire file)
```typescript
/* eslint-disable */
// or
/* eslint-disable @typescript-eslint/no-explicit-any */
```

**2. Block disables** (section of code)
```typescript
/* eslint-disable no-console */
console.log('debug');
console.log('more debug');
/* eslint-enable no-console */
```

**3. Line disables** (single line)
```typescript
// eslint-disable-next-line no-console
console.log('intentional');
```

**4. Inline disables**
```typescript
console.log('test'); // eslint-disable-line no-console
```

**TypeScript Categories:**

**1. File-level check disable** (entire file - HIGH RISK)
```typescript
// @ts-nocheck
```

**2. Line ignore** (single line)
```typescript
// @ts-ignore
const value = someUntypedValue.property;
```

**3. Expected error** (PREFERRED - self-documenting)
```typescript
// @ts-expect-error - Testing invalid input
const result = myFunction(invalidArg);
```

#### Step 3: Analyze Each Ignore

For each ignore, determine:

| Check | Status | Issue |
|-------|--------|-------|
| Has specific rule? (ESLint) | ⚠️ | Blanket disable is risky |
| Uses @ts-expect-error vs @ts-ignore? | ⚠️ | @ts-ignore is deprecated |
| Rule/error still exists? | ❓ | May be stale |
| Has justification comment? | ⚠️ | Undocumented suppression |
| In production code? | ⚠️ | Higher scrutiny needed |
| Is @ts-nocheck? | 🔴 | File-level disable is high risk |

#### Step 4: Generate Report

```markdown
# Lint & TypeScript Ignore Audit Report

## Summary

### ESLint Ignores
| Category | Count | Status |
|----------|-------|--------|
| Total ESLint Ignores | 45 | - |
| With Specific Rule | 38 | ✅ |
| Blanket Disables | 7 | ⚠️ Review |
| Documented | 25 | - |
| Undocumented | 20 | ⚠️ Add docs |

### TypeScript Ignores
| Category | Count | Status |
|----------|-------|--------|
| Total TS Ignores | 23 | - |
| @ts-ignore (deprecated) | 15 | ⚠️ Migrate to @ts-expect-error |
| @ts-expect-error | 6 | ✅ |
| @ts-nocheck (file-level) | 2 | 🔴 High Risk |
| Documented | 8 | - |
| Undocumented | 15 | ⚠️ Add docs |

## Risk Assessment

### 🔴 High Risk - File-Level Disables

**@ts-nocheck files (disables ALL type checking):**
| File | Line | Recommendation |
|------|------|----------------|
| legacy/old-module.ts | 1 | Migrate to typed code or use specific ignores |
| utils/untyped.ts | 1 | Add proper types |

**ESLint blanket disables (/* eslint-disable */):**
| File | Line | Scope | Recommendation |
|------|------|-------|----------------|
| legacy/old-api.ts | 1 | File | Specify rules or refactor |
| utils/hack.ts | 45 | Block | Document reason |

### 🟡 Medium Risk - @ts-ignore Usage (15)

`@ts-ignore` is deprecated. Migrate to `@ts-expect-error`:

| File | Line | Current | Recommended |
|------|------|---------|-------------|
| api/client.ts | 45 | @ts-ignore | @ts-expect-error - Third-party lib untyped |
| utils/helper.ts | 23 | @ts-ignore | @ts-expect-error - Legacy API |

**Why migrate?**
- `@ts-expect-error` fails if the error is fixed (prevents stale ignores)
- `@ts-ignore` silently suppresses even when not needed

### 🟡 Medium Risk - Undocumented Ignores

**ESLint (20 undocumented):**
| File | Line | Rule | Add Comment |
|------|------|------|-------------|
| services/auth.ts | 23 | no-explicit-any | Why any is needed |
| components/Form.vue | 89 | no-unused-vars | Explain intent |

**TypeScript (15 undocumented):**
| File | Line | Type | Add Comment |
|------|------|------|-------------|
| api/fetch.ts | 45 | @ts-expect-error | What error is expected |
| utils/cast.ts | 12 | @ts-ignore | Why type assertion needed |

### 🟢 Low Risk - Well Documented
Properly documented ignores - no action needed.

## Ignores by Type

### ESLint Rules (Top 10)
| Rule | Count | Files | Common Reason |
|------|-------|-------|---------------|
| @typescript-eslint/no-explicit-any | 15 | 8 | Third-party types |
| no-console | 12 | 6 | Debug logging |
| @typescript-eslint/no-unused-vars | 8 | 5 | Destructuring |

### TypeScript Ignores
| Type | Count | Risk | Action |
|------|-------|------|--------|
| @ts-expect-error | 6 | Low | Ensure documented |
| @ts-ignore | 15 | Medium | Migrate to @ts-expect-error |
| @ts-nocheck | 2 | High | Remove or justify |

## Files with Most Ignores

| File | ESLint | TS | Total | Risk |
|------|--------|-----|-------|------|
| packages/core/services/legacy.ts | 8 | 5 | 13 | High |
| apps/designer/src/utils/debug.ts | 5 | 3 | 8 | Medium |
| packages/editor/composables/old.ts | 2 | 6 | 8 | Medium |

## Recommendations

1. **Migrate @ts-ignore to @ts-expect-error (15 instances)**
   - Prevents stale ignores
   - Self-documents expected behavior

2. **Remove @ts-nocheck (2 files)**
   - Add proper types or use specific @ts-expect-error
   - File-level disable hides all type errors

3. **Add documentation to undocumented ignores (35 total)**
   - ESLint: 20 undocumented
   - TypeScript: 15 undocumented

4. **Review blanket ESLint disables (7)**
   - Specify exact rules being suppressed
```

### Mode: Cleanup

#### Step 1: Identify Stale Ignores

**For ESLint ignores:**
1. Temporarily remove the ignore
2. Run ESLint on that file
3. Check if the rule violation still exists
4. If no violation, the ignore is stale

**For TypeScript ignores:**
1. For `@ts-expect-error`: TypeScript already reports if no error exists
2. For `@ts-ignore`: Temporarily change to `@ts-expect-error`
3. Run `tsc --noEmit` on the file
4. If `@ts-expect-error` reports "unused", the ignore is stale

```bash
# Check for unused @ts-expect-error (TS2578)
npx tsc --noEmit 2>&1 | grep "TS2578"
```

#### Step 2: Interactive Cleanup

```
Found 12 potentially stale ignores:

=== ESLint ===
1. packages/core/utils.ts:45
   Rule: @typescript-eslint/no-explicit-any
   Ignore: // eslint-disable-next-line @typescript-eslint/no-explicit-any
   Status: No violation found - STALE

   Remove this ignore? [Y/n/skip]

=== TypeScript ===
2. packages/api/client.ts:23
   Type: @ts-ignore
   Status: No TS error on next line - STALE

   Remove this ignore? [Y/n/skip]

3. packages/utils/helper.ts:67
   Type: @ts-expect-error
   Status: TS2578: Unused '@ts-expect-error' directive - STALE

   Remove this ignore? [Y/n/skip]
```

#### Step 3: Apply Changes

```markdown
## Cleanup Results

| Type | Removed | Kept | Skipped |
|------|---------|------|---------|
| ESLint | 6 | 2 | 0 |
| TypeScript | 4 | 1 | 1 |
| **Total** | **10** | **3** | **1** |

### Removed Ignores
| File | Line | Type | Rule/Directive |
|------|------|------|----------------|
| utils.ts | 45 | ESLint | no-explicit-any |
| api.ts | 23 | TS | @ts-ignore |
| helper.ts | 67 | TS | @ts-expect-error |
```

### Mode: Add

Guide user to add proper ignore with documentation:

#### Step 1: Gather Information

Ask user:
1. Which file and line?
2. ESLint rule or TypeScript error?
3. Why is this ignore necessary?

#### Step 2: Generate Proper Ignore

**For ESLint:**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party library returns untyped data, proper typing would require extensive type guards
const result = externalLib.getData() as any;
```

**For TypeScript:**
```typescript
// @ts-expect-error - Property exists at runtime but not in type definitions
const value = legacyObject.undeclaredProperty;
```

#### Best Practices for Ignores

**ESLint Best Practices:**
```typescript
// ✅ GOOD - Specific rule with explanation
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API returns dynamic shape
const data = legacyApi.fetch() as any;

// ✅ GOOD - Scoped to minimum necessary
/* eslint-disable no-console -- Debug mode logging */
if (DEBUG) {
  console.log('Debug info');
}
/* eslint-enable no-console */

// ❌ BAD - Blanket disable
/* eslint-disable */

// ❌ BAD - No explanation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const thing: any = getValue();
```

**TypeScript Best Practices:**
```typescript
// ✅ GOOD - @ts-expect-error with explanation
// @ts-expect-error - Testing error handling with invalid input
const result = myFunction(null as unknown as RequiredType);

// ✅ GOOD - Documented reason for type bypass
// @ts-expect-error - Third-party lib missing type for this method
externalLib.undocumentedMethod();

// ⚠️ AVOID - @ts-ignore (deprecated, use @ts-expect-error)
// @ts-ignore
const value = untypedValue.prop;

// ❌ BAD - @ts-nocheck (disables ALL type checking)
// @ts-nocheck

// ❌ BAD - No explanation
// @ts-expect-error
const x = someValue as WrongType;
```

## Usage Examples

```bash
# Audit all ignores (ESLint + TypeScript)
/lint:ignore audit

# Audit only TypeScript ignores
/lint:ignore audit --type=ts

# Audit only ESLint ignores
/lint:ignore audit --type=eslint

# Audit specific package
/lint:ignore audit --scope=packages/core

# Filter by rule (ESLint)
/lint:ignore --rule=no-explicit-any

# Clean up stale ignores
/lint:ignore cleanup

# Add documented ignore
/lint:ignore add
```

## Ignore Documentation Templates

**ESLint format:**
```typescript
// eslint-disable-next-line <rule> -- <reason>
```

**TypeScript format:**
```typescript
// @ts-expect-error - <reason>
```

**Common valid reasons:**
- `-- Third-party library types are incomplete`
- `-- Legacy code pending refactor (JIRA-123)`
- `-- Intentionally unused for API compatibility`
- `-- Required for Vue reactivity system`
- `-- Testing error handling with invalid input`
- `-- Type exists at runtime but not in declarations`

## Migration Guide: @ts-ignore to @ts-expect-error

```typescript
// Before (deprecated)
// @ts-ignore
const value = obj.unknownProp;

// After (preferred)
// @ts-expect-error - Property exists at runtime from dynamic injection
const value = obj.unknownProp;
```

**Benefits of @ts-expect-error:**
1. **Self-cleaning**: Reports error if no longer needed (TS2578)
2. **Self-documenting**: Forces you to acknowledge expected error
3. **Prevents stale ignores**: Unlike @ts-ignore which silently ignores forever

## Integration

Integrate with code review process:
- Require documented ignores in PR reviews
- Run audit in CI to track ignore count
- Alert on new @ts-nocheck or blanket eslint-disable
- Fail CI if @ts-ignore count increases (encourage @ts-expect-error)
- Run `tsc --noEmit` to catch unused @ts-expect-error directives
