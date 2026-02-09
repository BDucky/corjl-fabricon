---
description: "Pre-load files by area. Args: <canvas|editor|auth|export|all>"
---

# Load Context

Pre-load relevant files for a specific area of the codebase in a single parallel batch. This eliminates the discovery phase where Claude searches for files it should already know about.

**Why this exists:** In past sessions, Claude spent 5-34 tool calls discovering files that are always the same. This loads them in 1 turn.

## Instructions

1. Parse the area keyword from `$ARGUMENTS`
2. Read ALL files for that area **in parallel in a single turn**
3. After reading, provide a brief 1-line summary per file noting its current state

## File Sets

### canvas
Read in parallel (all with limit=80):
- `packages/@corjl/fabric-fork/src/c-canvas.ts`
- `packages/@corjl/fabric-fork/src/c-static-canvas.ts`
- `packages/@corjl/fabric-fork/src/c-image.ts`
- `packages/@corjl/fabric-fork/src/c-textbox.ts`

### editor
Read in parallel (all with limit=80):
- `packages/editor/stores/editorStates.ts`
- `packages/editor/composables/fabric/useFabricCanvasHandler.ts`
- `packages/editor/composables/useDesignDownload.ts`
- `packages/editor/composables/editor-data.ts`

### export
Read in parallel (all with limit=80):
- `packages/editor/composables/useDesignDownload.ts`
- `packages/editor/components/modals/PreviewEditorModal.vue`
- `packages/editor/components/modals/MobilePreviewEditorDrawer.vue`
- `packages/@corjl/fabric-fork/src/c-static-canvas.ts`

### auth
Read in parallel (all with limit=50):
- `apps/auth/src/App.vue`
- `apps/auth/src/router/index.ts`
- `packages/plugins/src/amplify/index.ts`

### all
Read canvas + editor sets (8 files in parallel).

## Rules
- ALL reads MUST happen in a single parallel turn — no sequential reads
- Always use limit parameter
- After reading, just list the files with a 1-line summary each — do not explain the code

## Area

$ARGUMENTS
