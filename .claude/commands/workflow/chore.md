---
description: "Chore Planning"
---

# Chore Planning

Create a new plan in `.ai/specs/*.md` to resolve the `Chore` using the exact specified markdown `Plan Format`. Follow the `Instructions` to create the plan and use the `Relevant Files` to focus on the right files.

## Instructions

- You're writing a plan to resolve a chore, it should be simple but we need to be thorough and precise so we don't miss anything or waste time with any second round of changes.
- Create the plan in the `.ai/specs/*.md` file. **Auto-generate timestamp** by running `date +%y%m%d-%H%M%S` and use format: `.ai/specs/{TIMESTAMP}-chore-{short-description}.md` (e.g., `.ai/specs/251224-162236-chore-update-deps.md`). Note: `.ai/specs/` folder is gitignored - for temporary planning only.
- Use the plan format below to create the plan.
- Research the codebase and put together a plan to accomplish the chore.
- IMPORTANT: Replace every <placeholder> in the `Plan Format` with the requested value. Add as much detail as needed to accomplish the chore.
- Use your reasoning model: THINK HARD about the plan and the steps to accomplish the chore.
- Respect requested files in the `Relevant Files` section.
- Start your research by reading the `README.md` file and relevant docs in `docs/` folder.
- DO NOT make any code changes. Only create the plan file.
- You may run read-only commands (like `pnpm lint` without `--fix`) to gather information, but DO NOT run commands that modify files.

## Chore Types

Detect the chore type from keywords in the `Chore` section and include the appropriate additional sections:

### Refactor Tasks (keywords: refactor, restructure, reorganize, extract, split, merge)
Add these sections to the plan:
- **Current State**: Describe the current implementation and its issues
- **Refactor Goals**: What the code should look like after refactoring
- **Migration Strategy**: How to migrate existing usages (if breaking changes)
- **Risk Assessment**: Identify high-risk areas and mitigation strategies

### Optimize Tasks (keywords: optimize, performance, speed, memory, bundle, lazy)
Add these sections to the plan:
- **Performance Baseline**: Current metrics (load time, bundle size, memory usage)
- **Optimization Goals**: Specific, measurable targets (e.g., "reduce bundle size by 20%")
- **Measurement Strategy**: How to measure before/after improvements
- **Benchmark Commands**: Commands to run performance tests

## Relevant Files

Focus on the following files and directories:
- `README.md` - Project overview
- `docs/` - Documentation (architecture, CLI, packages)
- `apps/**` - Vue 3 applications (auth, designer, enduser, demo)
- `packages/**` - Shared libraries (core, editor, extensions, plugins)
- `scripts/` - CLI and utilities
- `package.json` - Scripts and dependencies
- `infrastructure/` - Deployment and backend configuration

Ignore `node_modules/` and `packages/@corjl/` (private forks).

## Plan Format

```md
# Chore: <chore name>

## Chore Description
<describe the chore in detail>

## Relevant Files
Use these files to resolve the chore:

<find and list the files that are relevant to the chore describe why they are relevant in bullet points. If there are new files that need to be created to accomplish the chore, list them in an h3 'New Files' section.>

## Impact Analysis
Identify which apps and packages are affected by this chore:

- **Apps affected**: <list specific apps: auth, designer, enduser, demo - or "none">
- **Packages affected**: <list specific packages: core, editor, extensions, plugins - or "none">
- **Shared dependencies**: <list any shared utilities, types, or services that will change>

<!-- FOR REFACTOR TASKS: Include this section -->
## Refactor Analysis
### Current State
<describe the current implementation, its structure, and pain points>

### Refactor Goals
<describe what the code should look like after refactoring>

### Migration Strategy
<if breaking changes: describe how to migrate existing usages>

### Risk Assessment
<identify high-risk areas and mitigation strategies>
<!-- END REFACTOR SECTION -->

<!-- FOR OPTIMIZE TASKS: Include this section -->
## Performance Analysis
### Performance Baseline
<current metrics: load time, bundle size, memory usage, render time>

### Optimization Goals
<specific, measurable targets - e.g., "reduce bundle size by 20%", "improve FCP by 500ms">

### Measurement Strategy
<how to measure before/after: browser devtools, lighthouse, custom benchmarks>

### Benchmark Commands
<commands to measure performance - e.g., `pnpm cli build --analyze`, lighthouse CLI>
<!-- END OPTIMIZE SECTION -->

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

<list step by step tasks as h3 headers plus bullet points. use as many h3 headers as needed to accomplish the chore. Order matters, start with the foundational shared changes required then move on to the specific changes required.>

## Validation Commands
Validation will be handled by the Test phase. No commands needed here.

## Notes
<optionally list any additional notes or context that are relevant to the chore that will be helpful to the developer>
```

## Chore
$ARGUMENTS