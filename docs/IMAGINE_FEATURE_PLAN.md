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
- [x] `replicateClient.ts` accepts `{ mockupImage, faceImage, prompt }` and returns a result image URL
- [x] Polls Replicate prediction until `succeeded` or `failed`
- [ ] First end-to-end generation works against a real signed-in account *(awaiting device verification — needs `VITE_REPLICATE_API_TOKEN` in `.env`)*
- [x] Errors surface to the user (not just console)
- [x] `pnpm type-check` is clean
- [x] `pnpm lint` is clean

**Implementation notes (2026-05-18):**
- Uses `CapacitorHttp` (from `@capacitor/core`) — bypasses WebView CORS that would block a raw `fetch` to `api.replicate.com`. On web (Vite dev server in a desktop browser), Capacitor falls back to fetch and the call will fail CORS — testing must happen in the iOS build.
- Default model slug is `zsxkib/pulid-flux`, overridable via `VITE_REPLICATE_MODEL`.
- PuLID-Flux is face-only; the `mockupImage` is captured + accepted by `generateImage` but **not currently sent** to the model. It will be persisted alongside the result in Step 4. If we need it to actually influence the output in the prototype, we can either splice it into the prompt or switch to a multi-image model.
- Submit handler in `ImagineCreateModal.vue` now shows: generating overlay → result image (with "Start over" / "Done") → inline red error text under the prompt if it fails.

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
| 3 — Replicate generation | End-to-end working on iPhone (face preserved on garments, ~20–60s/run). Design fidelity needs work — see next-session task. | _uncommitted_ |
| 3.5 — Per-product routing | Garment route → IDM-VTON, object route → PuLID-Flux. Object route can't reproduce the design (face-only model); honest UI copy in place. | _uncommitted_ |
| **NEXT — Step 3.6** | **Improve design fidelity in IDM-VTON output** (see below) | — |
| 4 — Persistence | Not started | — |
| 5 — Lambda | Not started | — |

## Next session — Step 3.6: improve design fidelity in IDM-VTON output

**The problem.** Reverted to single-stage IDM-VTON on 2026-05-18 because the
two-stage (PuLID body-synth → IDM-VTON) lost face identity. Single-stage
preserves the user's real face, but the printed design on the resulting t-shirt
doesn't closely match the customer's actual artwork — it comes out smudged,
small, or partially missing. Per user: *"the design is not secured based on the
real design on the modal."*

**Why this is hard.** IDM-VTON is a person-image diffusion model; it doesn't
copy the garment image's pixels directly, it learns a representation and
re-paints. Fine details (logos, text, intricate artwork) get lost in this
re-paint. The mockup-capture quality is one lever; the model is another.

**Things to try, ranked by expected impact ÷ effort:**

1. **Auto-frame the mockup capture on the print area.** Before capture, set the
   viewer camera to a "Front" preset and zoom so the garment's `printAreaUV`
   region fills ~80% of the frame. Currently the user can do this manually but
   often doesn't. Code touchpoints: `useCameraPresets`, `MODEL_TEXTURE_DEFAULTS`
   in `viewer3d/constants.ts` (already has `printAreaUV`), and the Step 2
   capture path in `ImagineCreateModal.vue`.
2. **Tune IDM-VTON params.** Bump `steps: 30 → 40`. Try `force_dc: true` (Dual
   Conditioning — paper claims better detail preservation at higher cost).
   Cheap experiment; A/B against the current baseline.
3. **Switch to a different try-on model.** Replicate has several:
   - `omniedgeio/idm-vton` (variant)
   - `kwaivgi/kling-virtual-try-on` (commercial — also fixes our licensing
     problem; explore at the same time)
   - CatVTON, OOTDiffusion, FitDiT (if published)
   Smoke-test one or two against the same mockup + face and pick the winner.
4. **Render the design directly instead of via the 3D mockup.** Instead of
   capturing the 3D scene, build a flat product-catalog-style image of the
   garment in JS: take the original design PNG, composite it onto a base
   garment template image (white t-shirt) at the right print-area position.
   This skips 3D entirely and gives IDM-VTON the cleanest possible garment
   input. Requires a per-product base-garment image and per-product placement
   coordinates. Most reliable but most work.
5. **Pass the original design image as an additional conditioning signal.**
   Not supported by IDM-VTON directly; would require a different model. Defer.

Start with #1 — it's a viewer3d composition change, no model swap, no
additional API cost. If #1 alone gets us "design is recognizable in the
output", we're done. If not, layer #2. If still not, evaluate #3 or #4.

---

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

### 2026-05-18 — Step 3 implementation

**What got done (uncommitted):**
- New `src/services/imagine/replicateClient.ts`. Single export `generateImage({ mockupImage, faceImage, prompt })`:
  - Reads `VITE_REPLICATE_API_TOKEN` (throws a user-readable error if missing).
  - Reads optional `VITE_REPLICATE_MODEL` (defaults to `zsxkib/pulid-flux`).
  - Converts the face Blob to a base64 data URI (chunked `arrayBuffer` → `btoa` — avoids `FileReader`, which isn't in the ESLint global allowlist).
  - POSTs to `/v1/models/{owner}/{name}/predictions` via `CapacitorHttp` (bypasses WebView CORS).
  - Polls `/v1/predictions/{id}` every 2s, 5-min timeout.
  - Returns the first output URL; throws on `failed` / `canceled` / timeout.
- `ImagineCreateModal.vue` submit handler is now `async` and calls `generateImage`. Adds `isGenerating`, `generationError`, `resultUrl` state; renders a generating overlay during the call, swaps Step 4 for an inline result view on success (with "Start over" + "Done" CTAs), and shows the error inline in red under the prompt if it fails. Back button is hidden during generating and on the result view.
- `.env.example` documents `VITE_REPLICATE_API_TOKEN` and the optional `VITE_REPLICATE_MODEL` override.
- `pnpm type-check` and `pnpm lint` both clean.

**To test:**
1. Add `VITE_REPLICATE_API_TOKEN=<token>` to `.env` (from https://replicate.com/account/api-tokens).
2. `pnpm build && npx cap sync ios`.
3. Clean Build Folder in Xcode (⇧⌘K), then ⌘R to phone.
4. Sign in → Imagine tab → Create → pick design → capture mockup → take face photo → enter prompt → Generate. Expect ~30–90s wait, then result image.

**Open question for Step 3.5 / Step 4 scoping:**
- PuLID-Flux is face-only and currently ignores `mockupImage`. The user's vision is "person wearing the mockup" — to get the mockup pixels into the output we either (a) richer prompt referencing the design (cheap, lossy), (b) splice mockup + face into a single side-by-side input image (hack), or (c) swap to a multi-image conditioning model. Worth a decision before Step 4 persists the mockup blob to S3.

### 2026-05-18 — Auto-prompt (no user input)

**Why:** User feedback — letting customers type a prompt is poor UX. Replaced the free-text textarea with an auto-generated prompt that varies by 3D model.

**What got done (uncommitted, on top of the earlier Step 3 changes):**
- New `src/services/imagine/promptBuilder.ts`. Exports `buildPrompt(modelId)` and `productLabel(modelId)`. Holds per-product templates for all 9 `BUNDLED_MODELS` (`tshirt`, `polo`, `hoodie`, `tanktop`, `totebag`, `phonecase`, `coffeemug`, `cardboardbox`, `standee`) plus a generic fallback. Every template emphasizes "same person", "exact face features", and "design exactly as on the reference mockup", and frames the product naturally for that type (chest-out, held in hand, beside the person, etc.).
- `ImagineCreateModal.vue`:
  - Removed the `prompt` ref and the textarea + label + tip.
  - Step 4 now shows a one-line reassurance ("We'll create a photorealistic image of you with the [product]…") instead of a prompt input.
  - `canGenerate` no longer depends on a typed prompt — it requires `viewerStore.activeModelId` to be set (so we know which template to use). All 4 sub-step requirements are otherwise unchanged.
  - `submit` calls `buildPrompt(viewerStore.activeModelId)` and passes the result to `generateImage`.
- `pnpm type-check` and `pnpm lint` both clean.

**Honest limitation re-stated:** PuLID-Flux is face-only — no prompt can make it reproduce the customer's exact design pixels or guarantee the chosen product geometry. The per-model prompt only steers framing/scene. True design + product preservation needs an architecture change (IP-Adapter / ControlNet / multi-image conditioning), tracked as a Step 3.5 decision before Step 4.

### 2026-05-18 — Step 3.5: per-product model routing (IDM-VTON for garments)

**Why:** The user explicitly wants "face + design + product all preserved". PuLID-Flux alone can't satisfy that. Added a per-product router so apparel products get a real try-on model that preserves the printed design on the garment.

**Routing:**
| Product | Route | Model (default) |
|---|---|---|
| tshirt, polo, hoodie, tanktop | `garment` | `cuuupid/idm-vton` |
| totebag, phonecase, coffeemug, cardboardbox, standee | `face` | `zsxkib/pulid-flux` |

The router is `modelKind(modelId)` in `promptBuilder.ts`. Defaults are overridable via `VITE_REPLICATE_MODEL_GARMENT` and `VITE_REPLICATE_MODEL_FACE`.

**What got done (uncommitted, on top of Step 3 + the auto-prompt change):**
- `promptBuilder.ts`: added `MODEL_KIND` + `modelKind()` + `buildGarmentDescription()` (IDM-VTON's `garment_des` input).
- `replicateClient.ts`: rewritten to a router. `generateImage({ modelId, mockupImage, faceImage })` (no more `prompt` arg — the route picks the prompt internally). Garment route POSTs to IDM-VTON with `{ garm_img, human_img, garment_des, category: 'upper_body', crop: false, seed, steps: 30 }`. Face route is unchanged. Polling is shared.
- `ImagineCreateModal.vue`: submit now passes `modelId` instead of `prompt`. Step 3 face-capture hint adapts ("A chest-up shot works best so the garment fits naturally" for garments). Step 4 reassurance honestly differentiates between routes: garments get a "design preserved" promise, non-garments get a "design is a close approximation" caveat.
- `.env.example`: documents both model overrides.

**Done when (Step 3.5):**
- [x] Garment products route to IDM-VTON
- [x] Non-garment products keep using PuLID-Flux
- [x] Step 4 copy honestly reflects what each route preserves
- [x] `pnpm type-check` + `pnpm lint` clean
- [ ] First end-to-end run on iPhone for a t-shirt (or polo) — visually verify the design transfers
- [ ] First end-to-end run for a mug (or other face-route product) — confirm face preservation still works

**Open caveats:**
- IDM-VTON expects an upper-body human photo. A face-only crop will still work but the lower body may be hallucinated awkwardly. The Step 3 hint nudges users toward chest-up shots.
- Non-garment design fidelity is still poor (no specialized try-on model for these). If we want pixel-exact for mugs / phone cases too, we need either a per-product try-on model or an IP-Adapter pipeline — out of scope for Step 3.

### 2026-05-18 — Step 3 end-of-day (committed)

Long iterative session. Multiple architectural pivots based on device tests:

1. Started Step 3 with `zsxkib/pulid-flux` slug — wrong, 404. Verified via Replicate's API and switched to `bytedance/flux-pulid`.
2. `POST /v1/models/{slug}/predictions` returned 404 on community models — switched to resolving `latest_version.id` via `GET /v1/models/{slug}` then `POST /v1/predictions` with pinned SHA. Cached per session.
3. First successful run: t-shirt with a dark-background 3D viewer capture as `garm_img` → IDM-VTON couldn't extract the garment, output a plain skin-tone top. Added `cleanBackground` mode to `useExporter.captureBlob` — hides grid/staging/ground-shadow + swaps `scene.background` for white. Mockup thumb now looks like a flat product-catalog photo.
4. Tried a two-stage pipeline (PuLID body-synth → IDM-VTON) to remove the "chest must be visible" constraint. Face identity dropped noticeably; user preferred the single-stage real-face look. **Reverted to single-stage.** Restored the silhouette + chest-visibility guidance at Step 3 + the amber post-capture warning.
5. For non-garment products (mug/tote/etc.), tightened PuLID-Flux prompts to focus on FACE + PRODUCT + "design exists" (instead of claiming "exactly as on the mockup", which is impossible — PuLID can't see the mockup). Added `negative_prompt` to bias against blank products / distorted faces / cartoon style. Bumped `id_weight: 1`, `guidance_scale: 6`, `num_steps: 28`. Set `output_format: 'png'` (the model uppercases internally and PIL chokes on `'JPG'`).
6. Filtered Step 1's design grid to only show designs with `thumbnailFilePath !== null` so users don't pick a blank canvas and burn credits.
7. Added a product picker at Step 2 (horizontal chips for the 7 visible bundled models) and Change/Retake shortcuts at Step 4.

**End-of-day state (this commit):**
- Garment route (tshirt/polo/hoodie/tanktop) → single-call IDM-VTON. Face: ✅. Design: ⚠️ recognizable but not pixel-exact. Next session focus.
- Object route (totebag/phonecase/coffeemug/cardboardbox/standee) → single-call PuLID-Flux with tightened prompts + negative prompt. Face: ✅. Design: hallucinated, not the customer's actual artwork (model limitation).
- Cost per run: ~$0.023 (garment) or ~$0.04 (object). Both well under $1 of credits for a hands-on test session.

**Known issues that are NOT Step 3.6 scope:**
- IDM-VTON licensing (CC BY-NC-SA 4.0) — must swap before commercial launch.
- PuLID-Flux uses FLUX.1-dev which is also non-commercial.
- Token is still in `VITE_REPLICATE_API_TOKEN` and ships in the bundle to the phone — that's the Step 5 (Lambda) fix, not blocking iteration.
