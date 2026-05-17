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
- [x] "Create new" on the Imagine tab opens the flow
- [x] Each of the 4 sub-steps works and shows valid output
- [x] Submit logs `{ designId, mockupImageBlob, faceImageBlob, prompt }`
- [x] Cancel/close works at every sub-step
- [x] No regression on Step 1's tab behavior
- [x] `pnpm type-check` is clean
- [x] `pnpm lint` is clean
- [ ] Verified visually in the dev server *(your turn — run `pnpm dev`)*

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
| 1 — Tab shell | Committed + visually verified on iPhone | `d14db71` |
| 2 — New Imagine flow (desktop layout) | Committed; type-check + lint + build clean | `bf562ee` |
| 2.5 — Mobile polish of the modal | Committed (sticky CTAs, safe area, 2-col grid, ≥44px touch targets); **not yet visually verified on iPhone** | _see session log 2026-05-17_ |
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

- [x] Paste the real `VITE_GRAPHQL_ENDPOINT` into `/Users/binhle/Documents/GitHub/corjl-fabricon/.env`
- [x] `pnpm dev` and confirm Designs list loads
- [x] Review `git diff` for the two uncommitted files
- [x] Commit Step 1: `feat(imagine): add tab shell to MyDesignsView`
- [x] Begin Step 2 — see "Step 2" section above

### 2026-05-17 — Step 2 implementation

**What got done (uncommitted):**
- New `ImagineCreateModal.vue` (4 stacked sub-steps: design picker → 3D snapshot → face photo → prompt + submit). Submit currently `console.log`s `{ designId, mockupImageBlob, faceImageBlob, prompt }`.
- New `services/imagine/captureFace.ts` — clean variant of `loadFromCamera` that returns `{ file, previewUrl }` without mutating the viewer3d store.
- `useExporter` extended with `captureBlob({ width, height, transparent })` so a snapshot can be captured without triggering the download. `exportImage` was refactored to use it (behaviour unchanged).
- `ThreeViewer` exposes `captureBlob` alongside the existing export methods.
- `MyDesignsView` "Create new" button now opens the modal.
- `pnpm type-check` and `pnpm lint` both clean.

**Implementation note:** the modal embeds the singleton `ThreeViewer` and drives it through `useViewer3dStore`. On open/close/back, `viewerStore.reset()` is called to keep state from leaking back into `/editor/:id` if the user navigates there afterwards.

**Next pickup:**
- Visually verify the 4-step flow on the dev server. Watch for: thumbnail-CORS issues when calling `setDesignFromUrl` (texture mapper does its own CORS load); auto-selected model fits the chosen design's aspect ratio; capture button gates on `!isModelLoading && !isDesignLoading`.
- Commit Step 2: `feat(imagine): add 4-step Create Imagine flow`.
- Begin Step 3 (Replicate generation) — see "Step 3" section above.

### 2026-05-17 — End-of-day handoff (long session, many tangents)

**What got committed (in order):**

| Commit | Scope |
|---|---|
| `bf562ee` | `feat(imagine): add 4-step Create Imagine flow` — Step 2 of this plan |
| `669d8ac` | `feat(editor): phone-first layout with bottom sheets` — EditorView rebuilt for mobile (canvas fills viewport; Design / Properties / Tools open as `MobileBottomSheet`s) |
| `9f999d5` | `fix(ios): make capacitor.config.ts transpile cleanly to CJS` — unblocked `npx cap sync ios` on Node 22+ (was throwing "exports is not defined" because `import.meta.url` forced ESM) |
| `35534b7` | `fix(editor): hide hidden models in batch preview, auto-close sheet on model switch` |
| `02586ad` | `chore(editor): trim Tools sheet to Auto-rotate + Batch preview` |
| `c299412` | `fix(modal): stop ExportDialog from overflowing horizontally on phone` — also hardened BaseModal (`overflow-x-hidden`, `flex-wrap` footer, smaller padding on phone) |
| `c47d17e` | `feat(auth): Face ID / Touch ID sign-in with Settings toggle` — plumbing all in, capacitor-biometric-auth + secure-storage installed, NSFaceIDUsageDescription added to Info.plist, new `/settings` route, `src/services/biometric.ts`, auth store extended |
| `1c63052` | `chore(auth): defer Face ID sign-in UI behind a feature flag` — `BIOMETRIC_FEATURE_ENABLED = false` in `services/biometric.ts` hides the LoginView button + Settings biometric section. Underlying plumbing remains for revival. |
| _this commit_ | `chore(imagine): mobile-polish the Create Imagine modal` — sticky footer CTAs with `pb-safe-b`, `pt-safe-t` header, `overflow-x-hidden` body, 2-col grid on phone, ≥44px touch targets, ≥48px primary CTAs, back button reserves layout space on Step 1 |

**State of Imagine specifically:**
- Step 1 (tab shell): shipped, verified.
- Step 2 (modal flow): shipped, mobile-polished. **Not yet device-verified after the mobile polish** — first iPhone test should cover the 7-step checklist in the chat log under "Verify on iPhone after ⌘R". Watch the Step 4 prompt textarea + iOS keyboard interaction in particular.
- Step 3 (Replicate generation): not started. Next major feature.

**Open follow-ups (not started):**
- **Face ID refresh-token flow bug.** Enabling biometric and then tapping "Sign in with Face ID" returned "Saved sign-in is no longer valid". Likely the Cognito REFRESH_TOKEN_AUTH call in `signinWithBiometric` fails because the cached refresh token was minted *before* `clearAuth` ran (early version of the feature wiped the token on sign-out). The wipe was later removed (still removed) and a "different user signs in" safety net was added. Re-verify the full flow before flipping `BIOMETRIC_FEATURE_ENABLED` back to true.
- **`ImagineCreateModal` Step 2 ThreeViewer in modal.** Embeds the singleton viewer3d store — if the user later navigates to `/editor/:id`, `viewerStore.reset()` should keep the state clean, but worth a smoke test.
- **BatchPreview on phone.** Still uses `BaseModal` (centered card, max-w-md). The export-modal fixes apply automatically (it shares BaseModal), but it has not been device-verified.
- **Imagine modal CORS.** `setDesignFromUrl` reads only natural dimensions (no CORS), but the texture mapper does its own CORS-enabled image load on the CDN thumbnail. If you see a `tainted canvas` SecurityError on `captureBlob`, the CDN is missing `Access-Control-Allow-Origin`.

**Process notes for next session (in addition to memory):**
- The user does **not** want auto-commit during iteration — verify on device first, commit only when they say so. See `feedback_no_commit_until_verified.md` in memory.
- **Mobile UX is the primary quality bar.** See `feedback_mobile_first_quality_bar.md`.
- iOS deploy loop: `pnpm build && npx cap sync ios && ⌘R` in Xcode. The phone won't pick up new code from `pnpm build` alone.
- `capacitor.config.ts` is fragile on Node 22 + `"type": "module"` — keep using `process.cwd()` instead of `import.meta.url` if you edit it.
