# Imagine Feature — Plan & Progress

**Branch:** `feat/camera-imagine`
**Started:** 2026-05-13

## Vision

Personalized AI virtual try-on. The user combines:

- **Text prompt** — describes the desired scene
- **3D mockup snapshot** — the existing product with the user's design applied (already available in this app)
- **Face photo** — a real customer's face (already available via the camera capture in commit `21781e5`)

…to generate an AI image of *that specific person* wearing/using the mockup with the design correctly applied.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Entry point | Tab in `MyDesignsView` | Imagine is a gallery of generated try-ons, not a per-design editor action |
| AI backend | Replicate (PuLID-Flux first, InstantID fallback) | Strong face-identity preservation; single HTTP API |
| API key handling | Client-side prototype → Lambda before ship | Get something working fast, harden before exposing to mobile |

## Steps

Each step is one commit and must be verified in the browser before moving to the next.

### Step 1 — Tab shell in `MyDesignsView`

Add a tab switcher above the designs grid. State lives in the route query (`?tab=imagine`). Imagine tab renders an empty state with a non-functional "Create new" CTA.

**Files expected to change:**
- `src/views/MyDesignsView.vue`

**Done when:**
- [x] Tabs render at the top of `MyDesignsView`
- [x] Clicking a tab updates the URL to (default) or `?tab=imagine`
- [x] Refreshing the page preserves the active tab (state lives in route query)
- [x] Browser back/forward switches tabs (uses `router.replace`)
- [x] Imagine tab shows an empty state with a "Create new" button (disabled, wires up in Step 2)
- [x] The existing Designs grid still works exactly as before when on the Designs tab
- [x] `pnpm type-check` is clean
- [x] `pnpm lint` is clean
- [ ] Verified visually in the dev server *(your turn — run `pnpm dev` and click around)*

### Step 2 — New Imagine flow (UI only, no AI)

A modal (or sub-route) with four stacked sub-steps. Submit `console.log`s the payload.

**Sub-steps inside the flow:**
1. Pick a design (reuse `DesignCard` grid)
2. Snapshot the 3D mockup (reuse `ThreeViewer` snapshot util — locate it from commit `a47f0e3`)
3. Capture face photo (extract a clean variant of `loadFromCamera` that returns a `File` instead of mutating the viewer3d store)
4. Prompt textarea + Generate button

**Done when:**
- [ ] "Create new" on the Imagine tab opens the flow
- [ ] Each of the 4 sub-steps works and shows valid output
- [ ] Submit logs `{ designId, mockupImageBlob, faceImageBlob, prompt }`
- [ ] Cancel/close works at every sub-step
- [ ] No regression on Step 1's tab behavior

### Step 3 — Replicate (PuLID-Flux) generation

Direct client call. Token from `VITE_REPLICATE_API_TOKEN`.

**Files expected to change:**
- `.env.example` (new)
- `src/services/imagine/replicateClient.ts` (new)
- The Imagine flow's submit handler

**Done when:**
- [ ] `replicateClient.ts` accepts `{ mockupImage, faceImage, prompt }` and returns a result image URL
- [ ] Polls Replicate prediction until `succeeded` or `failed`
- [ ] First end-to-end generation works against a real signed-in account
- [ ] Errors surface to the user (not just console)

### Step 4 — Persist Imagine jobs to S3 + AppSync

**Files expected to change:**
- `amplify/backend/api/corjlapi/schema.graphql` — add `ImagineJob` model
- `src/services/imagine/` — upload helpers + job CRUD
- Imagine tab — replace empty state with real `listImagineJobs` grid

**`ImagineJob` shape (draft):**
```graphql
type ImagineJob @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  designId: ID!
  mockupKey: String!
  faceKey: String!
  prompt: String!
  status: ImagineStatus!
  resultKey: String
  errorMessage: String
  createdAt: AWSDateTime!
}
```

**Done when:**
- [ ] `amplify push` succeeds with the new model
- [ ] Mockup snapshot + face photo upload to S3 before Replicate is called
- [ ] Job row gets created with status PENDING, updated to SUCCEEDED/FAILED
- [ ] Imagine tab grid loads past jobs for the signed-in user

### Step 5 — Move Replicate call into a Lambda

Replace the client-side Replicate call with an Amplify Function. The token never ships to mobile.

**Done when:**
- [ ] `VITE_REPLICATE_API_TOKEN` is removed from frontend env
- [ ] Lambda reads the job, calls Replicate, writes the result back
- [ ] End-to-end generation still works from the mobile build

## Progress

| Step | Status | Commit |
|---|---|---|
| 1 — Tab shell | Implemented + visually verified on iPhone (2026-05-13). Not yet committed. | _uncommitted_ |
| 2 — New Imagine flow | Not started | — |
| 3 — Replicate generation | Not started | — |
| 4 — Persistence | Not started | — |
| 5 — Lambda | Not started | — |

## Pre-flight reminders

- **Real Cognito test account required.** Auth bypass attempt on 2026-05-12 was abandoned because designs need real tokens. Sign in on the dev server before testing anything that touches a saved design.
- **One commit per step.** Keeps each diff reviewable and revertable.

---

## Session log

### 2026-05-13 — Step 1 implemented; env blocker discovered

**What got done:**
- Wrote this plan document.
- Created 5 session tasks (one per step).
- Implemented Step 1: tabs + route-query state + Imagine empty state in `src/views/MyDesignsView.vue`.
- `pnpm type-check` and `pnpm lint` both clean.
- Visually verified on iPhone — tab strip renders correctly, Imagine tab shows empty state, no regression on the Designs grid.

**Uncommitted at end of session:**
- `src/views/MyDesignsView.vue` (Step 1 implementation)
- `docs/IMAGINE_FEATURE_PLAN.md` (this file)

These are intentionally **left uncommitted** — `git status` tomorrow will show them so the next session can pick up, review the diff, and commit as `feat(imagine): add tab shell to MyDesignsView`.

**Blocker discovered (unrelated to Imagine):**
- On this Mac, signing in shows `Failed to load designs — VITE_GRAPHQL_ENDPOINT is not configured`.
- Cause: `.env` is gitignored (correctly), so the AppSync URL filled in on the M1 Mac never transferred. The new `.env` here has `VITE_GRAPHQL_ENDPOINT=` (blank).
- This is **not caused by the branch** or by Step 1's changes. Switching branches doesn't touch `.env`. The Imagine tab itself works fine without the endpoint; only the Designs grid requires it.
- Fix tomorrow (any one of):
  1. `cat .env | grep GRAPHQL_ENDPOINT` on the M1 Mac and paste the value into `.env` on this Mac.
  2. AWS Console → AppSync → Corjl API → Settings → copy "API URL" into `.env`.
  3. Pull from a private gist / 1Password note if there's one for the dev `.env`.

### Tomorrow's pickup checklist

- [ ] Paste the real `VITE_GRAPHQL_ENDPOINT` into `/Users/binhle/Documents/GitHub/corjl-fabricon/.env`
- [ ] `pnpm dev` and confirm Designs list loads
- [ ] Review `git diff` for the two uncommitted files
- [ ] Commit Step 1: `feat(imagine): add tab shell to MyDesignsView`
- [ ] Begin Step 2 — see "Step 2" section above
