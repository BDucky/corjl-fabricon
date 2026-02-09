---
description: "Bug Planning"
---

# Bug Planning

Create a new plan in `.ai/specs/*.md` to resolve the `Bug` using the exact specified markdown `Plan Format`. Follow the `Instructions` to create the plan use the `Relevant Files` to focus on the right files.

## Instructions

- You're writing a plan to resolve a bug, it should be thorough and precise so we fix the root cause and prevent regressions.
- Create the plan in the `.ai/specs/*.md` file. **Auto-generate timestamp** by running `date +%y%m%d-%H%M%S` and use format: `.ai/specs/{TIMESTAMP}-bug-{short-description}.md` (e.g., `.ai/specs/251224-162236-bug-fix-login-error.md`).
- Use the plan format below to create the plan.
- Research the codebase to understand the bug, reproduce it, and put together a plan to fix it.
- IMPORTANT: Replace every <placeholder> in the `Plan Format` with the requested value. Add as much detail as needed to fix the bug.
- Use your reasoning model: THINK HARD about the bug, its root cause, and the steps to fix it properly.
- IMPORTANT: Be surgical with your bug fix, solve the bug at hand and don't fall off track.
- IMPORTANT: We want the minimal number of changes that will fix and address the bug.
- If you need a new library, use `pnpm add <package>` (or `pnpm add -D <package>` for dev dependencies) and be sure to report it in the `Notes` section of the `Plan Format`.
- Respect requested files in the `Relevant Files` section.
- Start your research by reading the `README.md` file.

## Relevant Files

Focus on the following files based on the bug context:
- `README.md` - Project overview
- `docs/**` - Architecture and feature documentation
- `apps/**` - Vue 3 applications (auth, designer, enduser, demo)
- `packages/core/**` - Core components & shared services
- `packages/editor/**` - Editor functionality
- `packages/extensions/**` - Plugin system
- `packages/plugins/graphql/**` - GraphQL operations

Identify the specific app or package related to the bug and focus on those files.

**Debugging tips:**
- Use Vue DevTools browser extension for component state inspection.
- Check Network tab for API/GraphQL request issues.
- Review browser console for runtime errors.

## Plan Format

```md
# Bug: <bug name>

## Bug Description
<describe the bug in detail, including symptoms and expected vs actual behavior>

## Problem Statement
<clearly define the specific problem that needs to be solved>

## Solution Statement
<describe the proposed solution approach to fix the bug>

## Steps to Reproduce
<list exact steps to reproduce the bug>

## Root Cause Analysis
<analyze and explain the root cause of the bug>

## Relevant Files
Use these files to fix the bug:

<find and list the files that are relevant to the bug describe why they are relevant in bullet points. If there are new files that need to be created to fix the bug, list them in an h3 'New Files' section.>

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

<list step by step tasks as h3 headers plus bullet points. use as many h3 headers as needed to fix the bug. Order matters, start with the foundational shared changes required to fix the bug then move on to the specific changes required to fix the bug. Include tests that will validate the bug is fixed with zero regressions.>

## Validation Commands
Validation will be handled by the Test phase. No commands needed here.

## Notes
<optionally list any additional notes or context that are relevant to the bug that will be helpful to the developer>
```

## Bug
$ARGUMENTS