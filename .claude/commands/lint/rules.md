---
description: "ESLint Rules Reference. Args: [--category=<cat>] [--severity=<sev>] [rule-name] - List and explain active ESLint rules"
---

# ESLint Rules Reference

List, explain, and analyze ESLint rules configured in this project. Understand why rules are enabled/disabled and get recommendations for improvements.

## Purpose

This command helps developers:
- Understand which ESLint rules are active
- Learn why specific rules are configured
- Find rules by category or severity
- Get recommendations for new rules
- Troubleshoot rule conflicts

## Arguments

Format: `[options] [rule-name]`

| Argument | Description | Example |
|----------|-------------|---------|
| _(empty)_ | List all active rules with summary | `/lint:rules` |
| `<rule-name>` | Explain specific rule | `/lint:rules no-unused-vars` |
| `--category=<cat>` | Filter by category | `/lint:rules --category=typescript` |
| `--severity=error` | Show only errors | `/lint:rules --severity=error` |
| `--severity=warn` | Show only warnings | `/lint:rules --severity=warn` |
| `--unused` | Show disabled rules | `/lint:rules --unused` |
| `--recommend` | Get rule recommendations | `/lint:rules --recommend` |

### Categories

| Category | Description |
|----------|-------------|
| `typescript` | TypeScript-specific rules |
| `vue` | Vue.js rules |
| `import` | Import/export rules |
| `style` | Code style rules |
| `best-practices` | Best practice rules |
| `errors` | Possible error detection |

## Variables

- **rule_name**: Specific rule to explain (optional)
- **category**: Filter by category (optional)
- **severity**: Filter by severity - `error`, `warn`, `off` (optional)
- **show_unused**: Show disabled rules (default: false)
- **show_recommend**: Show recommendations (default: false)

## Instructions

### Step 1: Locate ESLint Configuration

Find all ESLint config files:

```bash
find . -name "eslint.config.*" -o -name ".eslintrc*" | grep -v node_modules
```

Common locations:
- `eslint.config.js` (flat config)
- `.eslintrc.js` / `.eslintrc.json` (legacy)
- `packages/*/eslint.config.js` (package-specific)

### Step 2: Parse Configuration

Read and parse ESLint configuration to extract:
- Active rules and their settings
- Extended configs (e.g., `@typescript-eslint/recommended`)
- Plugin configurations
- Override rules for specific file patterns

### Step 3: Generate Output

#### Mode: List All Rules (default)

```markdown
# ESLint Rules - Project Configuration

## Summary
- **Total Rules**: {count}
- **Error Level**: {count}
- **Warning Level**: {count}
- **Disabled**: {count}

## Rules by Category

### TypeScript Rules ({count})
| Rule | Severity | Auto-fix | Description |
|------|----------|----------|-------------|
| @typescript-eslint/no-unused-vars | error | No | Disallow unused variables |
| @typescript-eslint/no-explicit-any | error | No | Disallow `any` type |
| @typescript-eslint/explicit-function-return-type | off | No | Require return types |

### Vue Rules ({count})
| Rule | Severity | Auto-fix | Description |
|------|----------|----------|-------------|
| vue/multi-word-component-names | error | No | Require multi-word names |
| vue/no-unused-vars | error | No | Disallow unused variables |

### Import Rules ({count})
| Rule | Severity | Auto-fix | Description |
|------|----------|----------|-------------|
| simple-import-sort/imports | error | Yes | Sort imports |
| import/no-duplicates | error | Yes | No duplicate imports |

### Style Rules ({count})
| Rule | Severity | Auto-fix | Description |
|------|----------|----------|-------------|
| prefer-const | error | Yes | Prefer const over let |
| no-var | error | Yes | Disallow var |

## Extended Configurations
- `eslint:recommended`
- `@typescript-eslint/recommended`
- `plugin:vue/vue3-recommended`

## Plugins
- `@typescript-eslint`
- `vue`
- `simple-import-sort`
```

#### Mode: Explain Specific Rule

When `rule_name` is provided:

```markdown
# Rule: @typescript-eslint/no-unused-vars

## Configuration in This Project
- **Severity**: error
- **Auto-fixable**: No
- **Category**: TypeScript

## Current Settings
\`\`\`json
{
  "@typescript-eslint/no-unused-vars": ["error", {
    "argsIgnorePattern": "^_",
    "varsIgnorePattern": "^_"
  }]
}
\`\`\`

## What This Rule Does
Disallows unused variables, functions, and function parameters. Variables that start with `_` are ignored.

## Why It's Enabled
- Keeps codebase clean
- Identifies dead code
- Prevents accidental variable shadowing

## Common Violations
\`\`\`typescript
// ❌ Bad
const unused = 'never used';
function foo(unusedParam) { }

// ✅ Good
const _intentionallyUnused = 'ignored by pattern';
function foo(_ignoredParam) { }
\`\`\`

## How to Fix
1. Remove the unused variable/parameter
2. Prefix with `_` if intentionally unused
3. Use the variable somewhere

## Related Rules
- `no-unused-vars` (base ESLint)
- `@typescript-eslint/no-unused-expressions`

## Documentation
- [Rule docs](https://typescript-eslint.io/rules/no-unused-vars)
```

#### Mode: Recommendations

When `--recommend` flag is used:

```markdown
# ESLint Rule Recommendations

## Recommended to Enable

### @typescript-eslint/consistent-type-imports
**Why**: Enforces consistent usage of type imports
**Impact**: Medium
**Auto-fixable**: Yes
\`\`\`json
"@typescript-eslint/consistent-type-imports": ["error", {
  "prefer": "type-imports"
}]
\`\`\`

### @typescript-eslint/no-floating-promises
**Why**: Prevents unhandled promise rejections
**Impact**: High
**Auto-fixable**: No
\`\`\`json
"@typescript-eslint/no-floating-promises": "error"
\`\`\`

## Recommended to Review

### @typescript-eslint/no-explicit-any
**Current**: error
**Suggestion**: Consider allowing in test files
\`\`\`json
{
  "files": ["**/*.spec.ts", "**/*.test.ts"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off"
  }
}
\`\`\`

## Potentially Conflicting Rules
- Rule A and Rule B may conflict - review configuration

## Performance Considerations
These rules may slow down linting:
- `import/no-cycle` - Consider disabling or using `maxDepth`
```

### Step 4: Output

- Display the generated content
- For long outputs, save to `.ai/reports/eslint-rules.md`

## Usage Examples

```bash
# List all active rules
/lint:rules

# Explain specific rule
/lint:rules no-unused-vars
/lint:rules @typescript-eslint/no-explicit-any

# Filter by category
/lint:rules --category=typescript
/lint:rules --category=vue

# Show only errors
/lint:rules --severity=error

# Get recommendations
/lint:rules --recommend

# Show disabled rules (potential to enable)
/lint:rules --unused
```

## Rule Categories Reference

| Category | Plugins/Configs |
|----------|-----------------|
| typescript | @typescript-eslint/* |
| vue | vue/* |
| import | import/*, simple-import-sort/* |
| style | Formatting, naming conventions |
| best-practices | Code quality patterns |
| errors | Possible runtime errors |
