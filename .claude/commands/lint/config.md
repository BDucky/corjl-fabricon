---
description: "Lint Configuration Check. Args: [check|optimize|migrate] - Validate and optimize ESLint configuration"
---

# Lint Configuration Check

Validate, analyze, and optimize ESLint configuration. Detect issues, suggest improvements, and help with migrations.

## Purpose

This command helps maintain ESLint configuration:
- Validate configuration syntax and structure
- Detect deprecated rules and plugins
- Find rule conflicts
- Suggest performance optimizations
- Assist with config migrations (e.g., to flat config)

## Arguments

Format: `[mode] [options]`

| Argument | Description | Example |
|----------|-------------|---------|
| _(empty)_ | Same as `check` | `/lint:config` |
| `check` | Validate current config | `/lint:config check` |
| `optimize` | Suggest optimizations | `/lint:config optimize` |
| `migrate` | Help migrate config format | `/lint:config migrate` |
| `--verbose` | Show detailed output | `/lint:config check --verbose` |

## Variables

- **mode**: `check`, `optimize`, or `migrate` (default: check)
- **verbose**: Show detailed analysis (default: false)

## Instructions

### Mode: Check (default)

#### Step 1: Locate Configuration Files

Find all ESLint config files:

```bash
# Flat config (ESLint 9+)
find . -name "eslint.config.*" | grep -v node_modules

# Legacy config
find . -name ".eslintrc*" | grep -v node_modules

# Package.json eslintConfig
grep -l "eslintConfig" */package.json
```

#### Step 2: Validate Syntax

For each config file:
1. Check JSON/JS syntax is valid
2. Verify required fields exist
3. Check for typos in rule names

```bash
# Test config validity
pnpm exec eslint --print-config src/index.ts > /dev/null
```

#### Step 3: Check for Issues

**Issue Categories:**

| Category | Description | Severity |
|----------|-------------|----------|
| Deprecated | Rule/plugin no longer maintained | Warning |
| Conflict | Rules that contradict each other | Error |
| Redundant | Rules already included in extends | Info |
| Unknown | Rule doesn't exist | Error |
| Performance | Rules that slow down linting | Warning |

#### Step 4: Generate Report

```markdown
# ESLint Configuration Check

## Configuration Files Found
| File | Format | Valid |
|------|--------|-------|
| eslint.config.js | Flat Config | ✅ |
| packages/core/.eslintrc.js | Legacy | ⚠️ Consider migrating |

## Validation Results

### ✅ Passed Checks
- Configuration syntax is valid
- All plugins are installed
- No unknown rules detected

### ⚠️ Warnings

#### Deprecated Rules (3)
| Rule | Status | Replacement |
|------|--------|-------------|
| @typescript-eslint/no-var-requires | Deprecated in v6 | Use `@typescript-eslint/no-require-imports` |
| indent | Deprecated | Use Prettier or `@stylistic/indent` |

#### Potentially Redundant Rules (2)
These rules are already included in your extends:
| Rule | Included In |
|------|-------------|
| no-unused-vars | eslint:recommended |
| no-undef | eslint:recommended |

### ❌ Errors

#### Rule Conflicts (1)
| Rules | Conflict |
|-------|----------|
| `indent` + `@typescript-eslint/indent` | Both formatting same code |

**Resolution**: Remove `indent`, keep TypeScript version.

#### Unknown Rules (0)
None found.

## Plugin Status

| Plugin | Version | Status | Latest |
|--------|---------|--------|--------|
| @typescript-eslint/eslint-plugin | 6.21.0 | ✅ | 7.1.0 |
| eslint-plugin-vue | 9.22.0 | ✅ | 9.23.0 |
| eslint-plugin-simple-import-sort | 10.0.0 | ✅ | 10.0.0 |

## Extends Chain
```
eslint:recommended
  └── @typescript-eslint/recommended
       └── plugin:vue/vue3-recommended
            └── Your custom rules
```

## Summary
- **Status**: ⚠️ Needs Attention
- **Errors**: 1
- **Warnings**: 5
- **Info**: 2
```

### Mode: Optimize

#### Step 1: Analyze Performance

Identify slow rules:

```bash
# Time ESLint execution
TIMING=1 pnpm exec eslint src/ --format json
```

#### Step 2: Check for Optimization Opportunities

**Performance Optimizations:**

| Optimization | Impact | Effort |
|--------------|--------|--------|
| Disable `import/no-cycle` | High | Low |
| Use `--cache` | High | Low |
| Limit TypeScript project files | Medium | Medium |
| Split config for different file types | Medium | Medium |

#### Step 3: Generate Optimization Report

```markdown
# ESLint Optimization Report

## Current Performance
- Average lint time: 45s
- Files linted: 523
- Rules active: 87

## Optimization Opportunities

### 🚀 High Impact

#### 1. Enable ESLint Cache
**Current**: Cache disabled
**Impact**: ~60% faster subsequent runs

Add to package.json scripts:
\`\`\`json
"lint": "eslint . --cache --cache-location node_modules/.cache/eslint"
\`\`\`

#### 2. Disable `import/no-cycle`
**Current**: Enabled
**Impact**: ~30% faster (this rule is expensive)

If you need cycle detection, consider:
- Run it only in CI
- Use `madge` separately

\`\`\`javascript
// In eslint.config.js
{
  rules: {
    'import/no-cycle': process.env.CI ? 'error' : 'off'
  }
}
\`\`\`

### 📈 Medium Impact

#### 3. Optimize TypeScript Parser
**Current**: Parsing all files with full type info

\`\`\`javascript
// Only use type-aware rules where needed
{
  files: ['**/*.ts', '**/*.tsx'],
  languageOptions: {
    parserOptions: {
      project: './tsconfig.eslint.json', // Smaller scope
    }
  }
}
\`\`\`

Create `tsconfig.eslint.json`:
\`\`\`json
{
  "extends": "./tsconfig.json",
  "include": ["src/**/*"],
  "exclude": ["**/*.spec.ts", "**/*.test.ts"]
}
\`\`\`

#### 4. Split Configuration
Lint different file types separately:

\`\`\`javascript
// Separate configs for faster targeted linting
export default [
  // Base config for all files
  baseConfig,
  // TypeScript-specific (heavier)
  typescriptConfig,
  // Vue-specific
  vueConfig,
  // Test files (relaxed rules)
  testConfig,
]
\`\`\`

### 📊 Estimated Impact

| Optimization | Time Saved | New Total |
|--------------|------------|-----------|
| Enable cache | -27s | 18s |
| Disable no-cycle | -8s | 10s |
| Optimize TS parser | -3s | 7s |
| **Combined** | **-38s** | **~7s** |

## Recommended Configuration

\`\`\`javascript
// eslint.config.js - Optimized
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.min.js',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@typescript-eslint': typescript },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        // Faster parsing
        EXPERIMENTAL_useProjectService: true,
      },
    },
  },
];
\`\`\`
```

### Mode: Migrate

Help migrate from legacy to flat config:

#### Step 1: Analyze Current Config

Read existing `.eslintrc.*` files and understand:
- Extends
- Plugins
- Rules
- Overrides
- Env settings

#### Step 2: Generate Flat Config

```markdown
# ESLint Migration Guide

## Current Configuration
- Format: `.eslintrc.js` (Legacy)
- ESLint Version: 8.x

## Migration to Flat Config

### Step 1: Update ESLint
\`\`\`bash
pnpm add -D eslint@latest
\`\`\`

### Step 2: Create New Config

\`\`\`javascript
// eslint.config.js
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default [
  // Global ignores
  {
    ignores: ['dist/**', 'node_modules/**'],
  },

  // Base JS config
  js.configs.recommended,

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': typescript,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // Your TypeScript rules
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },

  // Vue files
  {
    files: ['**/*.vue'],
    plugins: {
      vue,
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      // Your Vue rules
    },
  },
];
\`\`\`

### Step 3: Update package.json
\`\`\`json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
\`\`\`

### Step 4: Remove Old Config
\`\`\`bash
rm .eslintrc.js .eslintignore
\`\`\`

### Migration Mapping

| Legacy | Flat Config |
|--------|-------------|
| `extends` | Import and spread configs |
| `plugins` | `plugins` object with imports |
| `env` | `languageOptions.globals` |
| `parserOptions` | `languageOptions.parserOptions` |
| `overrides` | Separate config objects with `files` |
| `.eslintignore` | `ignores` array in config |
```

## Usage Examples

```bash
# Validate current configuration
/lint:config check

# Check with verbose output
/lint:config check --verbose

# Get optimization suggestions
/lint:config optimize

# Help migrate to flat config
/lint:config migrate
```

## Common Issues & Solutions

### Issue: "Rule not found"
```
Error: Definition for rule 'xxx' was not found
```
**Solution**: Install missing plugin or remove rule

### Issue: "Parsing error"
```
Parsing error: Cannot read file tsconfig.json
```
**Solution**: Check `parserOptions.project` path

### Issue: "Plugin conflict"
```
A]ll rules from 'xxx' are already defined
```
**Solution**: Remove duplicate plugin registration

## Integration

- Run `check` in CI to catch config issues
- Run `optimize` quarterly to maintain performance
- Run `migrate` when updating ESLint major versions
