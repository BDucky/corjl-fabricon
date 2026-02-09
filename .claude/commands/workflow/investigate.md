---
description: "Investigate Test Failure"
---

# Investigate Test Failure

Analyze a test failure to identify the root cause and propose a fix strategy. This command is called automatically during the SDLC retry loop when tests fail.

## Purpose

When tests fail during the SDLC pipeline, this command:
1. Analyzes the error output to understand what went wrong
2. Identifies the root cause category
3. Proposes a specific fix strategy
4. Returns structured JSON for automated processing

## Variables

- error_output: $1 - The test error output
- spec_file: $2 - Path to the spec file
- retry_attempt: $3 - Current retry attempt number

## Instructions

### 1. Parse the Error Output

Analyze the error message to identify:
- Which test file(s) failed
- The specific test case(s) that failed
- The assertion that failed (expected vs actual)
- Stack trace showing where the error occurred

### 2. Read Related Files

- Read the spec file to understand the intended behavior
- Read the source file(s) mentioned in the stack trace
- Read the test file to understand what was being tested

### 3. Determine Root Cause Category

Classify the failure into one of these categories:
- `logic`: Logic error in the implementation (wrong calculation, incorrect condition)
- `edge_case`: Missing edge case handling (null check, empty array, boundary)
- `type`: Type mismatch or TypeScript error
- `integration`: Integration issue between components
- `async`: Async/await issue (race condition, missing await)
- `test_bug`: The test itself is incorrect (not the implementation)
- `config`: Configuration or environment issue
- `unknown`: Cannot determine root cause

### 4. Propose Fix Strategy

Based on the root cause:
- List the specific file(s) that need to be modified
- Describe the exact change needed
- Provide code snippet if possible
- Estimate confidence level (high/medium/low)

### 5. Update Spec File

Append a "Fix Strategy" section to the spec file with your findings:
```markdown
## Fix Strategy (Retry {attempt})

**Root Cause**: {description}
**Category**: {category}
**Files to Modify**: {file list}

### Proposed Fix
{detailed fix instructions}
```

## Report

Return ONLY valid JSON (no markdown, no explanation):

```json
{
  "success": true,
  "root_cause": "Clear description of why the test failed",
  "category": "logic|edge_case|type|integration|async|test_bug|config|unknown",
  "affected_files": [
    {
      "file": "path/to/file.ts",
      "change_type": "modify|create|delete",
      "description": "What needs to change in this file"
    }
  ],
  "fix_strategy": "Step-by-step instructions to fix the issue",
  "code_snippet": "Optional: example code showing the fix",
  "confidence": "high|medium|low",
  "requires_human": false,
  "notes": "Optional: additional context or warnings"
}
```

### Output Rules

- `success`: `true` if root cause was identified
- `success`: `false` if unable to determine root cause
- `confidence`:
  - `high` - Clear error, obvious fix
  - `medium` - Likely cause, fix should work
  - `low` - Uncertain, may need human review
- `requires_human`: `true` if the fix requires human judgment (e.g., design decisions)

## Example Output

```json
{
  "success": true,
  "root_cause": "CartService.addItem() does not check if item already exists, causing duplicate entries",
  "category": "logic",
  "affected_files": [
    {
      "file": "packages/core/src/services/CartService.ts",
      "change_type": "modify",
      "description": "Add check for existing item before adding to cart"
    }
  ],
  "fix_strategy": "1. In addItem(), check if item.id already exists in cart\n2. If exists, increment quantity instead of adding new entry\n3. Add unit test for duplicate item scenario",
  "code_snippet": "const existing = this.items.find(i => i.id === item.id);\nif (existing) {\n  existing.quantity += item.quantity;\n} else {\n  this.items.push(item);\n}",
  "confidence": "high",
  "requires_human": false
}
```

## Input

Error Output:
$1

Spec File:
$2

Retry Attempt:
$3
