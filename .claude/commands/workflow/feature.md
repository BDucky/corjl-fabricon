---
description: "Feature Planning"
---

# Feature Planning

Create a new plan in `.ai/specs/*.md` to implement the `Feature` using the exact specified markdown `Plan Format`. Follow the `Instructions` to create the plan use the `Relevant Files` to focus on the right files.

## Instructions

- You're writing a plan to implement a net new feature that will add value to the application.
- Create the plan in the `.ai/specs/*.md` file. **Auto-generate timestamp** by running `date +%y%m%d-%H%M%S` and use format: `.ai/specs/{TIMESTAMP}-feature-{short-description}.md` (e.g., `.ai/specs/251224-162236-feature-add-dark-mode.md`).
- Use the `Plan Format` below to create the plan.
- Research the codebase to understand existing patterns, architecture, and conventions before planning the feature.
- IMPORTANT: Replace every <placeholder> in the `Plan Format` with the requested value. Add as much detail as needed to implement the feature successfully.
- Use your reasoning model: THINK HARD about the feature requirements, design, and implementation approach.
- Follow existing patterns and conventions in the codebase. Don't reinvent the wheel.
- Design for extensibility and maintainability.
- If you need a new library, use `pnpm add <package>` (or `pnpm add -D <package>` for dev dependencies) and be sure to report it in the `Notes` section of the `Plan Format`.
- Respect requested files in the `Relevant Files` section.
- Start your research by reading the `README.md` file and relevant docs in `docs/**`.
- **Ask clarifying questions before proceeding** if there is any ambiguity about the feature requirements, unclear edge cases, missing context, or uncertainty about how to handle specific scenarios. It's better to ask upfront than to make assumptions that lead to incorrect implementations.

## Relevant Files

Focus on the following files based on the feature context:
- `README.md` - Project overview
- `docs/**` - Architecture and feature documentation
- `apps/**` - Vue 3 applications (auth, designer, enduser, demo)
- `packages/core/**` - Core components & shared services
- `packages/editor/**` - Editor functionality
- `packages/extensions/**` - Plugin system
- `packages/plugins/graphql/**` - GraphQL operations

## Plan Format

```md
# Feature: <feature name>

## Feature Description
<describe the feature in detail, including its purpose and value to users>

## User Story
As a <type of user>
I want to <action/goal>
So that <benefit/value>

## Problem Statement
<clearly define the specific problem or opportunity this feature addresses>

## Solution Statement
<describe the proposed solution approach and how it solves the problem>

## Relevant Files
Use these files to implement the feature:

<find and list the files that are relevant to the feature describe why they are relevant in bullet points. If there are new files that need to be created to implement the feature, list them in an h3 'New Files' section.>

## Implementation Plan
### Phase 1: Foundation
<describe the foundational work needed before implementing the main feature>

### Phase 2: Core Implementation
<describe the main implementation work for the feature>

### Phase 3: Integration
<describe how the feature will integrate with existing functionality>

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

<list step by step tasks as h3 headers plus bullet points. use as many h3 headers as needed to implement the feature. Order matters, start with the foundational shared changes required then move on to the specific implementation. Include creating tests throughout the implementation process.>

## Testing Strategy
### Unit Tests
<describe unit tests needed for the feature>

### Integration Tests
<describe integration tests needed for the feature>

### Edge Cases
<list edge cases that need to be tested>

## Acceptance Criteria
<list specific, measurable criteria that must be met for the feature to be considered complete>

## Performance Considerations
<list any performance implications and optimization strategies if applicable - lazy loading, caching, virtualization, etc.>

## Validation Commands
Validation will be handled by the Test phase. No commands needed here.

## Notes
<optionally list any additional notes, future considerations, or context that are relevant to the feature that will be helpful to the developer>
```

## Feature
$ARGUMENTS