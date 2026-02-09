---
description: "Code Quality Audit. Args: [scope] [--metrics] [--depth=<n>] - Deep analysis of code quality beyond lint errors"
---

# Code Quality Audit

Perform comprehensive code quality analysis beyond basic linting. Analyze complexity, duplication, dependencies, and technical debt.

## Purpose

This command provides deep insights into code health:
- Identify complex, hard-to-maintain code
- Detect code duplication
- Find dead/unused code
- Analyze dependency structure
- Estimate technical debt
- Track quality metrics over time

## Arguments

Format: `[scope] [options]`

| Argument | Description | Example |
|----------|-------------|---------|
| _(empty)_ | Audit changed files | `/lint:audit` |
| `full` | Audit entire codebase | `/lint:audit full` |
| `<package>` | Audit specific package | `/lint:audit core` |
| `<file-path>` | Audit specific file | `/lint:audit src/services/api.ts` |
| `--metrics` | Show only metrics summary | `/lint:audit --metrics` |
| `--depth=<n>` | Analysis depth (1-3) | `/lint:audit --depth=3` |

### Analysis Depth

| Depth | Analysis Included |
|-------|-------------------|
| 1 | Basic metrics (LOC, complexity) |
| 2 | + Duplication, dependencies |
| 3 | + Dead code, full dependency graph |

## Variables

- **scope**: Target for analysis (default: affected)
- **depth**: Analysis depth 1-3 (default: 2)
- **metrics_only**: Show only summary metrics (default: false)

## Instructions

### Step 1: Determine Scope

Parse $ARGUMENTS to determine files to analyze:
- `full` → All source files
- `affected` → Changed files (git diff)
- `<package>` → Files in package
- `<file>` → Single file

### Step 2: Collect Metrics

#### 2.1 Lines of Code (LOC)

```bash
# Count lines by file type
find {scope} -name "*.ts" -o -name "*.vue" | xargs wc -l
```

Categorize:
- **Source Lines**: Actual code
- **Comment Lines**: Documentation
- **Blank Lines**: Empty lines

#### 2.2 Cyclomatic Complexity

Analyze each function/method for:
- Number of decision points (if, switch, loops, ternary)
- Complexity score per function
- Flag functions with complexity > 10

```markdown
| Function | File | Complexity | Status |
|----------|------|------------|--------|
| processOrder | orders.ts:45 | 15 | ⚠️ High |
| validateInput | utils.ts:12 | 5 | ✅ OK |
```

#### 2.3 Cognitive Complexity

Beyond cyclomatic complexity:
- Nesting depth
- Recursion
- Boolean logic complexity
- Early returns vs deep nesting

#### 2.4 Code Duplication (Depth 2+)

Find duplicated code blocks:

```bash
# Using jscpd or similar
npx jscpd {scope} --min-lines 5 --reporters json
```

Report:
- Duplicated blocks
- Percentage of duplication
- Files involved
- Suggestions for extraction

#### 2.5 Dependency Analysis (Depth 2+)

Analyze imports:
- Circular dependencies
- Unused imports
- Deep import chains
- External dependency usage

```bash
# Check for circular deps
npx madge --circular {scope}
```

#### 2.6 Dead Code Detection (Depth 3)

Find potentially unused:
- Exported functions never imported
- Unreachable code blocks
- Unused type definitions
- Commented-out code

### Step 3: Calculate Scores

#### Maintainability Index

Formula: `171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(L)`
- V = Halstead Volume
- G = Cyclomatic Complexity
- L = Lines of Code

Scores:
- **85-100**: Highly maintainable
- **65-84**: Moderately maintainable
- **0-64**: Difficult to maintain

#### Technical Debt Ratio

```
Debt Ratio = (Remediation Cost / Development Cost) × 100
```

Rating:
- **A**: ≤5% - Excellent
- **B**: 6-10% - Good
- **C**: 11-20% - Moderate
- **D**: 21-50% - Poor
- **E**: >50% - Critical

### Step 4: Generate Report

Create report at `.ai/reports/{TIMESTAMP}-quality-audit.md`:

```markdown
# Code Quality Audit Report

## Executive Summary

| Metric | Value | Rating | Trend |
|--------|-------|--------|-------|
| Maintainability Index | 72 | B | ↑ |
| Technical Debt Ratio | 8% | B | → |
| Code Duplication | 3.2% | A | ↓ |
| Average Complexity | 6.5 | B | → |

**Overall Grade: B**

## Detailed Metrics

### Lines of Code
| Category | Count | % |
|----------|-------|---|
| Source | 15,420 | 78% |
| Comments | 2,340 | 12% |
| Blank | 1,980 | 10% |
| **Total** | 19,740 | 100% |

### Complexity Analysis

#### High Complexity Functions (>10)
| Function | Location | Complexity | Recommendation |
|----------|----------|------------|----------------|
| processOrder | orders.ts:45 | 15 | Split into smaller functions |
| buildQuery | query.ts:120 | 12 | Extract conditions |

#### Complexity Distribution
- Low (1-5): 245 functions (72%)
- Medium (6-10): 78 functions (23%)
- High (11-20): 15 functions (4%)
- Very High (>20): 3 functions (1%)

### Code Duplication

**Duplication Rate: 3.2%**

| Clone | Lines | Files | Action |
|-------|-------|-------|--------|
| Clone #1 | 45 | api.ts, service.ts | Extract to shared utility |
| Clone #2 | 23 | FormA.vue, FormB.vue | Create base component |

### Dependency Analysis

#### Circular Dependencies
⚠️ **2 circular dependencies found**

1. `services/auth.ts` ↔ `services/user.ts`
   - Suggestion: Extract shared types to separate file

2. `stores/cart.ts` ↔ `stores/product.ts`
   - Suggestion: Use event bus or mediator pattern

#### Most Imported Files
| File | Import Count | Risk |
|------|--------------|------|
| utils/helpers.ts | 45 | High impact if changed |
| types/index.ts | 38 | Type changes cascade |

### Dead Code (Depth 3 only)

#### Potentially Unused Exports
| Export | File | Last Modified |
|--------|------|---------------|
| `formatLegacy()` | utils.ts:89 | 6 months ago |
| `OldInterface` | types.ts:45 | 1 year ago |

#### Commented Code Blocks
| File | Lines | Content Preview |
|------|-------|-----------------|
| api.ts | 45-67 | Old API implementation |

## Technical Debt Inventory

| Category | Items | Est. Hours | Priority |
|----------|-------|------------|----------|
| High Complexity | 18 functions | 24h | High |
| Duplication | 5 clones | 8h | Medium |
| Circular Deps | 2 cycles | 4h | High |
| Dead Code | 12 items | 2h | Low |
| **Total** | 37 items | **38h** | - |

## Recommendations

### Immediate Actions (High Priority)
1. **Refactor `processOrder` function** - Complexity 15
   - Split into: validateOrder, calculateTotals, applyDiscounts
   - Estimated effort: 4h

2. **Break circular dependency** - auth ↔ user
   - Extract `AuthUser` interface to shared types
   - Estimated effort: 2h

### Short-term (Medium Priority)
3. **Extract duplicated form validation** - 45 lines
   - Create `useFormValidation` composable
   - Estimated effort: 3h

### Long-term (Low Priority)
4. **Remove dead code** - 12 items
   - Verify unused, then delete
   - Estimated effort: 2h

## Quality Trends

If previous audits exist, show comparison:

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Maintainability | 68 | 72 | +4 ↑ |
| Duplication | 4.1% | 3.2% | -0.9% ↓ |
| Complexity Avg | 7.2 | 6.5 | -0.7 ↓ |
```

### Step 5: Output

1. Save report to `.ai/reports/{TIMESTAMP}-quality-audit.md`
2. Display summary to console
3. If `--metrics` flag, show only metrics table

## Usage Examples

```bash
# Quick audit of changed files
/lint:audit

# Full codebase audit
/lint:audit full --depth=3

# Audit specific package
/lint:audit core

# Just show metrics
/lint:audit --metrics

# Deep analysis of specific file
/lint:audit src/services/complex-service.ts --depth=3
```

## Quality Thresholds

Default thresholds (configurable):

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Cyclomatic Complexity | ≤10 | 11-20 | >20 |
| Cognitive Complexity | ≤15 | 16-30 | >30 |
| File Length | ≤300 | 301-500 | >500 |
| Function Length | ≤50 | 51-100 | >100 |
| Duplication | ≤3% | 3-5% | >5% |
| Maintainability Index | ≥65 | 40-64 | <40 |

## Integration

This audit can be used with:
- CI/CD pipelines for quality gates
- Sprint planning for tech debt prioritization
- Code review to focus on complex areas
- Documentation for architecture decisions
