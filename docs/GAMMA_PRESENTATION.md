<!--
═══════════════════════════════════════════════════════════════
  GAMMA THEME SETUP — paste these values into Gamma's theme editor
  (Brand → Theme → Custom) before generating the deck.
═══════════════════════════════════════════════════════════════

  BRAND               Corjl · a Rowboat Software product
  LOGO (header)       Upload  src/assets/corjl-logo.png  to Gamma
                      and pin it to the header on every slide.
  FOOTER              "Corjl try-it-on · © Rowboat Software"

  COLOR PALETTE       (from Corjl Tailwind theme)
  ─────────────────────────────────────────────────────────
  Primary (teal)        #086674   ← headings, links, accents
  Primary dark          #064E5A
  Primary light         #0A8A9C
  Accent (gold)         #F5B461   ← callouts, hover states
  CTA (red)             #D63E36   ← buttons, "live" badges
  Surface ground        #11141A   ← page background (dark)
  Surface 1             #1F232B   ← cards, code blocks
  Surface 2             #282D36   ← elevated panels
  Text primary          #E0E0E0
  Text muted            #9CA3AF
  Glow                  rgba(8, 102, 116, 0.30)

  TYPOGRAPHY
  Headings   Rubik (or fallback: Inter)
  Body       Rubik / Open Sans
  Code       JetBrains Mono / Fira Code

  VISUAL DIRECTION
  Dark mode. Schematic / blueprint aesthetic. Thin teal stroke
  lines on dark surfaces. Wireframe 3D meshes, isometric circuit-
  board patterns, exploded-axonometric diagrams. Avoid stock
  photos. Avoid bright gradients. Avoid emoji-heavy iconography.
═══════════════════════════════════════════════════════════════
-->

# Corjl try-it-on
### A cross-platform 3D mockup studio with AI virtual try-on, built for the phone in your pocket.

> *A Rowboat Software product · Corjl Labs*

> **Cover visual:** dark teal-on-charcoal hero. A wireframe 3D t-shirt mesh (low-poly, glowing teal `#086674` edges) floats above an isometric grid; thin schematic lines connect it to a phone outline and a stylized human face silhouette. Top-right: small Corjl logo + "Rowboat Software" wordmark.

---

## The Problem

- Designers and small sellers want to **see their artwork on a real product** before printing — but most mockup tools are flat, 2D, and locked to the desktop.
- Generic stock mockups don't show **your** customer wearing **your** design.
- AI image generators feel disconnected from a real product workflow — you get a pretty picture, not a usable mockup.
- Mobile-first creators have nowhere to do this end-to-end on a phone.

---

## The Vision

> **Visual:** four-step flow diagram on dark surface. Four numbered teal `#086674` circles connected by thin schematic arrows. Inside each circle: a stroke icon — `[ ↑ ]` upload, `[ ⌖ ]` target/placement, `[ ⟳ ]` orbit, `[ ⚡ ]` spark for AI. Gold `#F5B461` highlight on the AI step.

Corjl try-it-on turns any phone or browser into a **personal product studio**:

1. Upload or capture a design.
2. Drop it onto a real 3D product model (t-shirt, hoodie, mug, tote, phone case, standee, more).
3. Spin it, light it, color it, export it.
4. With one tap, **"Imagine"** generates a hyper-personal AI image of *you* — or your customer — actually using the product.

One codebase. Web, iOS, Android.

---

## What Makes It Different

- **Real 3D, not flat overlays** — Three.js renders each product with UV-correct texture placement, lighting, and orbit controls.
- **AI try-on with identity preservation** — face photo + 3D mockup + prompt → personalized image of the real person wearing the design (PuLID-Flux via Replicate).
- **Mobile-native by default** — Capacitor wraps the same Vue app into iOS/Android with camera, filesystem, and safe-area handling built in.
- **Serverless AWS backend** — Cognito, AppSync (GraphQL), DynamoDB, S3. Pay-per-use, scales to zero.

---

## Core Feature 1 — 3D Mockup Studio

> **Visual:** exploded axonometric blueprint of a t-shirt mesh, teal `#086674` wireframe edges on charcoal background. Annotation callouts in monospace label: `vertices · UV map · target mesh · directional light · OrbitControls`. Schematic measurement marks at the edges.

A live, interactive product preview powered by Three.js.

- **9 bundled product models**: t-shirt, hoodie, polo, tank top, tote bag, coffee mug, phone case, cardboard box, standee
- **Auto-fit UV mapping** — drop a design in, it lands correctly on the printable surface
- **Drag-to-reposition** on the model
- **Lighting presets** — Studio, Daylight, Dramatic, Flat
- **Product color picker**, ground shadow, auto-rotate
- **Camera angle presets** + multi-angle batch export (PNG/JPEG)

---

## Core Feature 2 — Camera as a Design Source

The phone's camera becomes a creative input, not just a viewer.

- Capacitor Camera plugin → capture a photo on-device
- Photo flows into the same upload pipeline as desktop designs
- Use a sketch, a fabric swatch, or anything in the world as a design texture
- Works offline up to the point of upload

---

## Core Feature 3 — "Imagine" AI Virtual Try-On

> **Visual:** schematic pipeline diagram. Three input nodes on the left (mockup PNG, face PNG, prompt text) feeding into a central "PuLID-Flux" labeled box with circuit-board traces; output on the right is a framed result image. All in teal `#086674` strokes with gold `#F5B461` accent on the PuLID-Flux box. Tiny ASCII-style ports/labels.

The signature feature. Four steps, one result.

1. **Pick a design** from the user's gallery
2. **Snapshot the 3D mockup** — captures the model with the design applied
3. **Capture a face photo** via camera
4. **Write a prompt** — "wearing this hoodie on a Tokyo street at night"

→ Sent to **Replicate (PuLID-Flux)** which preserves facial identity while compositing the mockup into the scene. Result is saved back to the user's "Imagine" gallery tab.

---

## The Imagine Workflow

> **Visual:** full-width data-flow schematic, dark surface. Three input ports stacked vertically on the left, connected via teal bus lines to a labeled `PuLID-Flux` processor block in the center; output goes through `S3 / AppSync` storage block to a phone-shaped gallery on the right. Use blueprint-style line weights, monospace labels, faint dotted grid background. Highlight the PuLID-Flux node in gold `#F5B461`.

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  3D Mockup PNG  │   │  Face Photo     │   │  Text Prompt    │
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔  │   │  ▔▔▔▔▔▔▔▔▔▔▔▔▔  │   │  ▔▔▔▔▔▔▔▔▔▔▔▔▔  │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         └─────────┬───────────┴───────────┬─────────┘
                   ▼                       ▼
              ╔═══════════════════════════════╗
              ║   Replicate · PuLID-Flux      ║   ← gold accent
              ║   (face-identity diffusion)   ║
              ╚═══════════════╤═══════════════╝
                              ▼
                  ┌───────────────────────┐
                  │  S3 · ImagineJob row  │
                  │  (status: SUCCEEDED)  │
                  └───────────┬───────────┘
                              ▼
                    ╭───────────────────╮
                    │  Imagine Gallery  │  ← phone outline
                    │  (Corjl try-it-on)│
                    ╰───────────────────╯
```

---

## Use Cases

- **Print-on-demand sellers** — show customers themselves in the product before they buy
- **Influencers & creators** — generate "wearing the merch" promo shots without a photoshoot
- **Designers** — sanity-check artwork on a real 3D garment in seconds
- **Gift shops & small brands** — let a buyer upload their face for a one-of-one mockup
- **Internal teams** — playful Slack-share moments of "you in the merch"

---

## Tech Stack — Frontend

- **Vue 3** + **TypeScript** (strict mode)
- **Vite** — fast dev server, code-split builds
- **Pinia** — state stores (auth, viewer3d, designs, imagine)
- **Tailwind CSS** — design system with safe-area utilities
- **Three.js** — WebGL 3D engine
- **Vue Router** — route-query state (tabs survive refresh)

---

## Tech Stack — Mobile

- **Capacitor 5** — native iOS & Android shells from the same Vue codebase
- **@capacitor/camera** — photo capture + gallery import
- **@capacitor/filesystem** — local cache
- **@capacitor/status-bar / splash-screen / keyboard** — native polish
- **Safe-area handling** for notched devices
- **Env-driven dev server URL** for fast iteration on real hardware

---

## Tech Stack — Backend (AWS, Serverless)

- **AWS Amplify Gen 2** — infrastructure as code (TypeScript)
- **Cognito User Pools** — email login, strong password policy
- **AppSync (GraphQL)** — typed API with field-level `@auth` rules
- **DynamoDB** — designs, projects, assets, exports, ImagineJobs
- **S3** — 3-tier access (public templates / protected projects / private uploads)
- **Lambda (planned)** — proxies the Replicate call so no API key ships to mobile

---

## Data Model

| Type | Purpose |
|---|---|
| `UserProfile` | Subscription tier, preferences |
| `DesignTemplate` | Reusable product templates (3D model, UV map, previews) |
| `DesignProject` | A user's working project — canvas state, view angle, lighting |
| `ProjectAsset` | Images, fonts, models, textures uploaded by the user |
| `ProjectExport` | Export history (PNG, JPEG, GLB, etc.) |
| `ImagineJob` | AI try-on jobs — mockup + face + prompt + result image |

All models gated by `@auth(rules: [{ allow: owner }])`.

---

## Architecture at a Glance

> **Visual:** layered system diagram in the style of a circuit-board schematic. Top layer = three device silhouettes (browser, iPhone, Android) wired with teal traces into a middle "Capacitor / Vue 3" plane; the plane connects via labeled GraphQL and S3 wires to a bottom "AWS Serverless" plane containing four chip-shaped nodes (Cognito · AppSync · DynamoDB · S3). A side branch off AppSync shows a tiny "Lambda → Replicate" co-processor in gold `#F5B461`. Dotted grid background, teal `#086674` strokes, monospace labels.

```
   ╔══════════════════════════════════════════════╗
   ║   Vue 3 App   ·   Web · iOS · Android        ║
   ║   ┌──────┐ ┌────────┐ ┌─────────┐ ┌──────┐   ║
   ║   │ Vue  │ │ Pinia  │ │ Three.js│ │ Cap. │   ║
   ║   └──────┘ └────────┘ └─────────┘ └──────┘   ║
   ╚════════════════════╤═════════════════════════╝
                        │  GraphQL  /  S3 signed URLs
                        ▼
   ╔══════════════════════════════════════════════╗
   ║   AWS Amplify Gen 2  ·  ap-southeast-1       ║
   ║   ┌─────────┐ ┌─────────┐ ┌──────┐ ┌──────┐  ║
   ║   │ Cognito │ │ AppSync │ │ Dynamo│ │  S3  │  ║
   ║   └─────────┘ └────┬────┘ └──────┘ └──────┘  ║
   ║                    │                          ║
   ║                    ▼                          ║
   ║          ╭─────────────────────╮              ║
   ║          │ Lambda → Replicate  │  ← gold       ║
   ║          │   (PuLID-Flux)      │              ║
   ║          ╰─────────────────────╯              ║
   ╚══════════════════════════════════════════════╝
```

One codebase · three surfaces · one serverless backend.

---

## End-to-End User Flow

1. **Sign in** with email (Cognito)
2. **My Designs** tab — browse / upload designs
3. Open a design → **3D Editor**: pick a product model, place artwork, light it, color it
4. **Export** a mockup PNG, or…
5. Switch to **Imagine** tab → "Create new"
6. Pick the design → snapshot the mockup → take a face photo → write a prompt
7. AI returns a personalized image → saved to the Imagine gallery
8. Share, download, iterate.

---

## Mobile-First Considerations

- **Touch-friendly orbit controls** in the 3D viewer
- **Safe-area aware** layouts (iPhone notch, Android gesture bar)
- **Capacitor camera** with permissions wired into `Info.plist` and `AndroidManifest`
- **Env-driven dev server** for live-reload on a real iPhone over LAN
- **Lower texture caps** and selective shadow disabling on mobile for 60fps target

---

## Quality, Performance, Security

**Performance targets**
- 60fps 3D rendering · sub-3s project load · <250KB gzipped bundle

**Quality gates**
- TypeScript strict mode · ESLint · Vitest unit tests · Playwright E2E

**Security**
- Cognito-issued JWTs · field-level GraphQL auth · pre-signed S3 URLs
- Replicate API key moves to Lambda before mobile ship — never bundled

---

## Roadmap

> **Visual:** horizontal Gantt-style timeline on dark surface. Each phase is a bar coloured by status: completed = solid teal `#086674`, in-progress = teal-to-gold gradient, planned = thin gold `#F5B461` outline only. Phases labeled in monospace below the bars. Technical/blueprint aesthetic with faint dotted grid.

| Phase | Status |
|---|---|
| 1 — Foundation (auth, structure, CI) | ✅ Complete |
| 2 — 3D Mockup Studio (9 models, lighting, export) | ✅ Complete |
| 3 — Template & project persistence (AppSync + DynamoDB) | 🟡 In progress |
| 4 — Mobile optimization (iOS shipped, Android next) | 🟡 In progress |
| 5 — Camera capture as design input | ✅ Complete |
| 6 — **Imagine** AI try-on (4-step flow + Replicate + Lambda) | 🟡 In progress |
| 7 — AR preview (ARKit / ARCore) | ⏳ Researching |

---

## Why This Project Matters

- Bridges **3D product visualization** and **generative AI** in a workflow normal people can actually use.
- Proves a small team can ship a **mobile-native AI product** on serverless AWS with zero ops overhead.
- Foundation for **AR product try-on** — the 3D + camera + identity-aware AI stack is the same one ARKit will plug into next.
- Built **one phase at a time**, each shippable and verified on a real device.

---

## Deep Tech — Frontend Runtime

**Vue 3 (Composition API)**
- All UI is single-file components (`.vue`) using `<script setup lang="ts">`. Reactivity is declarative; no virtual-DOM tax for our common case (small reactive surfaces wrapping a giant imperative Three.js scene).
- Composition API lets us extract `useThreeScene`, `useTextureMapper`, `useExporter` etc. as **plain functions** — testable in isolation, reusable between the editor and the Imagine modal.

**TypeScript (strict mode)**
- `tsconfig.json` runs in strict mode. Every Pinia store, every composable, every GraphQL payload is typed end-to-end.
- The 3D viewer relies on `@types/three` for type-safe scene graph access (`THREE.Mesh`, `THREE.MeshStandardMaterial`, `OrbitControls`).

**Vite**
- Dev server with HMR (`pnpm dev`) — sub-100ms edit-to-reload, including in the iPhone via `CAPACITOR_SERVER_URL`.
- Production build does **manual chunk splitting**: `vendor-vue`, `vendor-three`, `vendor-aws` are emitted as separate bundles so the heavy Three.js code can be cached independently of the AWS SDKs.
- Path aliases (`@/`, `@modules/`, `@services/`) keep imports flat across the modular `src/` tree.

**Pinia**
- State stores live under `src/stores/` (`auth`, `designs`) and `src/modules/viewer3d/store.ts` (viewer state).
- Why Pinia over Vuex: native TypeScript inference, no mutations boilerplate, composable-style stores that read like ordinary `useX()` hooks.

---

## Deep Tech — 3D Engine (Three.js)

> **Visual:** exploded scene-graph tree diagram. A central "Scene" node branches into "Camera", "Renderer", "OrbitControls", and a "Model (GLB)" subtree that further branches into "Mesh → Material → CanvasTexture". Teal strokes, gold accent on "CanvasTexture". Render as a technical org-chart on dark surface, monospace labels.

The 3D viewer is the largest technical surface. Each concern is one composable in `src/modules/viewer3d/composables/`:

| Composable | Three.js feature wrapped |
|---|---|
| `useThreeScene` | `Scene`, `PerspectiveCamera` (45° FOV), `WebGLRenderer` with `ACESFilmicToneMapping` + `SRGBColorSpace`, `OrbitControls` with damping, `PCFSoftShadowMap`, RAF loop + `ResizeObserver` |
| `useModelLoader` | `GLTFLoader` for `.glb` files in `public/models/` (9 product models) |
| `useTextureMapper` | `CanvasTexture` driven by a 2D canvas compositor; per-mesh `MeshStandardMaterial` swap; UV-bound-aware placement |
| `useDesignPlacement` | Recomputes UVs for planar (t-shirt, tote) vs cylindrical (mug) surfaces |
| `useDesignDrag` | Pointer events → UV-space drag of the design region |
| `useLighting` | Ambient + directional + rim lights, swappable presets (Studio / Daylight / Dramatic / Flat) |
| `useCameraPresets` | Tweens camera position + target for Front / 3-Quarter / Back / Top angles |
| `useGroundShadow` | Cheap contact shadow plane below the model (no full shadow-pass cost) |
| `useEnvironmentMap` | HDR-style environment for PBR reflections |
| `useAutoRotate` | OrbitControls' `autoRotate` toggle |
| `useProductMaterial` | Tint the product color while preserving the design texture |
| `useExporter` | Headless render at user-chosen resolution → `canvas.toBlob('image/png')` |
| `useMultiAngleExport` | Walks camera presets, calls `useExporter` for each, batches as a ZIP via `fflate` |
| `useTurntableExport` | Rotates the model, captures frames, encodes a GIF via `gifenc` |
| `usePrintAreaOverlay` | Debug overlay showing the printable region in UV space |

**Why `preserveDrawingBuffer: true` on the renderer** — required so `toBlob` after a render call returns actual pixels instead of a cleared buffer. Critical for the Imagine snapshot path.

---

## Deep Tech — Texture Pipeline

> **Visual:** four-stage pipeline diagram, left-to-right. Stage 1: a flat user image. Stage 2: a UV-unwrap diagram of the mesh (the "atlas"). Stage 3: a `<canvas>` element symbol with the image positioned into the UV bounds. Stage 4: the curved 3D mesh with the texture applied. Each stage connected by teal `#086674` arrows, labeled in monospace. Blueprint aesthetic on dark surface.

The killer detail: a user's flat image becomes a correctly-placed texture on a curved 3D garment.

**Steps (each is one util in `src/modules/viewer3d/utils/`):**

1. **`computeUVBounds`** — for each target mesh, walk the UV buffer to find the printable region's min/max in UV space.
2. **`generatePlanarUVs`** / **`generateCylindricalUVs`** — if the model lacks usable UVs, project them (planar for shirts, cylindrical for mugs).
3. **`textureCompositor`** — draws the user's image onto a backing `<canvas>` at the correct UV offset/scale/rotation. The canvas itself becomes a `THREE.CanvasTexture` — so subsequent drags re-paint the canvas and Three.js auto-updates the GPU texture (`needsUpdate = true`).
4. **`useTextureMapper`** swaps the targeted mesh's material for a `MeshStandardMaterial` with the canvas texture as its `map`, preserving the original color in `savedMaterialColors` for restoration.

**Why a 2D canvas in the middle** — it lets us re-composite (move, scale, color-fill the background) without re-uploading the user's image to the GPU each frame.

---

## Deep Tech — Mobile (Capacitor 5)

> **Visual:** cross-section diagram of a phone. Outer layer = "Native shell (iOS / Android)". Inner layer = "WKWebView / WebView". Innermost = "Vue 3 app". Sideways arrows show the JS↔Native bridge with labeled plugins (`Camera`, `Filesystem`, `Keyboard`, `StatusBar`). Teal strokes, gold highlight on the Camera bridge arrow.

Capacitor wraps the same Vue web app into a native iOS/Android shell. Configuration in `capacitor.config.ts`:

- **`appId: com.corjl.tryiton`**, **`appName: Corjl try-it-on`**, **`webDir: dist`**
- **Live reload on device** — if `CAPACITOR_SERVER_URL` is set (read from `.env` without pulling in `dotenv`), the app loads from the Vite dev server over LAN. Unset = bundled `dist/` for TestFlight builds.
- **Plugins wired:**
  - `@capacitor/camera` — `presentationStyle: 'popover'`, used by both design upload and the Imagine face capture
  - `@capacitor/filesystem` — local cache for downloads
  - `@capacitor/status-bar` — light text, dark background, overlays the web view
  - `@capacitor/keyboard` — `resizeOnFullScreen: true` so inputs don't get hidden
  - `@capacitor/splash-screen` — auto-hides after 3s
- **iOS**: `contentInset: 'automatic'` for safe-area handling
- **Android**: `captureInput: true` to keep keyboard events in the web view

**Camera usage example** — `src/services/imagine/captureFace.ts`:
- `Camera.getPhoto({ resultType: CameraResultType.Uri, source: CameraSource.Prompt })` lets the user pick between gallery and camera
- The returned `webPath` is `fetch`ed back into a `Blob`, wrapped as a `File`, and an `objectURL` preview is created
- Cancellation is caught explicitly (`/cancel/i.test(err.message)`) — every other error bubbles up

---

## Deep Tech — Auth (Cognito via AWS Amplify)

**Backend** — `amplify/auth/resource.ts`:
- `defineAuth` declares a Cognito User Pool with email login (`verificationEmailStyle: 'CODE'`)
- Strong password policy: **12 chars min**, requires upper, lower, numbers, special chars
- Account recovery: email only · MFA: off (will be added)
- Mutable user attributes: `email`, `givenName`, `familyName`, `phoneNumber`

**Frontend** — `src/stores/auth.ts` (Pinia store):
- Exposes `signUp`, `signIn`, `signOut`, `confirmSignUp`, `resetPassword`
- Uses `aws-amplify/auth` for the actual Cognito calls
- Token kept in `localStorage` for session persistence; auto-initialized on app boot in `main.ts`
- The store's `isAuthenticated` is the single source of truth for route guards

---

## Deep Tech — Data Layer (AppSync + GraphQL)

**Backend** — `amplify/data/resource.ts`:
- `defineData({ schema, authorizationModes: { defaultAuthorizationMode: 'userPool' } })`
- Default auth = Cognito User Pool — every query/mutation requires a valid JWT
- Schema defined as TypeScript in `amplify/data/schema.ts` (code-first, no `.graphql` SDL drift)
- Per-model `@auth(rules: [{ allow: owner }])` so users can only see/edit their own rows

**Frontend** — `src/services/graphql.ts` + `src/services/queries/`:
- Typed query/mutation wrappers
- Pinia stores (`designs.ts`) call these and cache results reactively
- Errors surface to the UI via the `LoadingOverlay` pattern reused from `viewer3d`

---

## Deep Tech — Storage (S3 via Amplify)

**Backend** — `amplify/storage/resource.ts`:

Three access tiers in one bucket, enforced by Amplify-generated IAM:

| Prefix | Who can read | Who can write |
|---|---|---|
| `public/*` | Guest + authenticated | (curated upload only) |
| `protected/{identity_id}/*` | Owner + other authenticated users | Owner only |
| `private/{identity_id}/*` | Owner only | Owner only |

**Frontend** — `src/services/s3.ts`:
- Uses `@aws-sdk/client-s3` directly + `@aws-sdk/s3-request-presigner` for signed URLs
- `uploadToS3(key, file)` — generic File/Blob upload
- `uploadCanvasAsImage(canvas, key)` — converts a canvas to a PNG blob then uploads (used by mockup snapshots)
- `getSignedUrl(key, expiresIn)` — short-lived URL for private downloads

---

## Deep Tech — The Imagine Pipeline (in code)

> **Visual:** sequence diagram in the style of a UML/timing chart. Vertical lifelines (left → right): `User`, `ImagineModal`, `ThreeViewer`, `Capacitor.Camera`, `S3`, `Lambda`, `Replicate`. Numbered horizontal arrows between them show the message order. Teal strokes on dark surface, monospace labels, blueprint grid background.

**File map:**
- `src/components/imagine/ImagineCreateModal.vue` — 4-step wizard UI (Teleport-mounted full-screen modal, stepper bar, Back/Close header)
- `src/services/imagine/captureFace.ts` — Capacitor camera → `File` + preview URL
- `src/modules/viewer3d/composables/useExporter.ts` — new `captureBlob({ width, height, transparent })` headless render
- `src/modules/viewer3d/components/ThreeViewer.vue` — exposes `captureBlob` to parents via `defineExpose`
- `src/views/MyDesignsView.vue` — Imagine tab + "Create new" CTA, route-query state (`?tab=imagine`)

**Sequence on submit:**
1. User picks a design from `designsStore.designs` (reuses `DesignCard` grid)
2. The embedded `ThreeViewer` loads that design's texture; `captureBlob({ transparent: true })` produces a clean PNG
3. `captureFacePhoto()` returns the user's face as a `File`
4. Prompt textarea content + both blobs + `designId` form the payload
5. **Today:** payload is `console.log`ged (Step 2 complete, Step 3 next)
6. **Step 3 (next):** `services/imagine/replicateClient.ts` POSTs to Replicate's REST API, polls the prediction until `succeeded` or `failed`, returns a URL
7. **Step 4 (planned):** mockup + face PNGs are uploaded to S3 *before* the Replicate call; an `ImagineJob` row is created with `status: PENDING`, updated to `SUCCEEDED`/`FAILED`
8. **Step 5 (planned):** the Replicate call moves into an Amplify Function (Lambda) so the API token never ships to mobile

---

## Deep Tech — AI Model Choice

**PuLID-Flux on Replicate** (with InstantID as fallback)
- *Why PuLID-Flux:* preserves facial identity dramatically better than vanilla SDXL or stock IP-Adapter approaches, while still respecting the prompt's scene/style
- *Why Replicate:* one HTTP POST + polling; no model hosting, no GPU ops, billed per second of inference
- *Why InstantID as fallback:* slightly cheaper, still face-aware, used when PuLID-Flux fails or queue is slow
- *Inputs:* mockup image (the rendered 3D product), face image (Capacitor camera), text prompt
- *Output:* a single image; result key stored on the `ImagineJob` so the gallery can render it

---

## Deep Tech — Build, CI, Quality

**Build pipeline (`pnpm` scripts):**
- `pnpm dev` — Vite dev server (HMR, host: true so the iPhone can reach it)
- `pnpm build` — production bundle (vendor splitting, sourcemaps on)
- `pnpm preview` — serve the built `dist/` locally
- `pnpm capacitor:sync` — copy `dist/` into the iOS/Android shells
- `pnpm capacitor:open:ios` / `:android` — open Xcode / Android Studio
- `pnpm amplify:sandbox` — ephemeral AWS sandbox for dev
- `pnpm amplify:deploy` — pipeline deploy

**Quality gates:**
- `pnpm type-check` — `tsc --noEmit` in strict mode
- `pnpm lint` — ESLint with `eslint-plugin-vue` + `@typescript-eslint`
- `pnpm test` — Vitest (unit, jsdom-free via `happy-dom`)
- `pnpm e2e` — Playwright (chromium + webkit + android-chrome)

Every step in `docs/IMAGINE_FEATURE_PLAN.md` requires `pnpm type-check` and `pnpm lint` to be clean *before* commit.

---

## Deep Tech — Feature × Tech Matrix

| Feature | Frontend | 3D / Media | Mobile | Backend | AI |
|---|---|---|---|---|---|
| Sign up / Sign in | Vue 3 + Pinia (`auth.ts`) | — | — | Cognito (Amplify Gen 2) | — |
| Designs gallery (`/designs`) | Vue + Pinia (`designs.ts`) | `<img>` thumbs | — | AppSync (GraphQL) + DynamoDB | — |
| Design upload (file) | `useDesignInput` | `THREE.CanvasTexture` | — | S3 (`uploadToS3`) | — |
| Design upload (phone camera) | `useDesignInput.loadFromCamera` | same texture path | `@capacitor/camera` | S3 | — |
| Pick a 3D product | `ModelLibraryPanel.vue` | `GLTFLoader` + `public/models/*.glb` | — | — | — |
| Place design on model | `useDesignPlacement` + `useDesignDrag` | UV math + `CanvasTexture` | Touch events | — | — |
| Color the product | `useProductMaterial` | `MeshStandardMaterial.color` | — | — | — |
| Light the scene | `useLighting` + presets | Ambient/Directional/Rim | — | — | — |
| Orbit / camera presets | `useThreeScene` + `useCameraPresets` | `OrbitControls`, tweened camera | Touch gestures | — | — |
| Auto-rotate / turntable | `useAutoRotate` / `useTurntableExport` | OrbitControls + `gifenc` | — | — | — |
| Export single PNG | `useExporter.exportImage` | `toBlob('image/png')` | — | — | — |
| Multi-angle batch export | `useMultiAngleExport` | loop + `fflate` ZIP | — | — | — |
| Imagine — pick design | `ImagineCreateModal` step 1 | — | — | designs from AppSync | — |
| Imagine — mockup snapshot | `ImagineCreateModal` step 2 | `useExporter.captureBlob` | — | — | — |
| Imagine — face capture | `captureFace.ts` | `URL.createObjectURL` preview | `@capacitor/camera` | — | — |
| Imagine — generate | `replicateClient.ts` (planned) | — | — | S3 + AppSync (`ImagineJob`) | Replicate / PuLID-Flux |
| Imagine — gallery | Imagine tab in `MyDesignsView` | — | — | `listImagineJobs` query | — |

---

## Deep Tech — Why These Choices

- **Vue 3 + Vite + Pinia over React/Next**: smaller bundle, simpler SFC ergonomics, and `<script setup>` keeps the imperative Three.js layer cleanly separated from reactive UI. Pinia stores compose like hooks without the dependency-array footguns.
- **Three.js over Babylon.js**: lighter, more mature for static product rendering, larger ecosystem for `GLTFLoader` + `OrbitControls` + post-processing.
- **Capacitor over React Native / native rewrite**: literally the same Vue codebase ships to web + iOS + Android. Critical for a small team.
- **AWS Amplify Gen 2 over Gen 1**: code-first TypeScript (`defineAuth`, `defineData`, `defineStorage`) instead of an interactive CLI; per-environment sandboxes; no `amplify-cli` global drift.
- **AppSync over a REST API**: typed schema, generated client, field-level `@auth`, real-time subscriptions available for free when we need them.
- **Replicate over self-hosting PuLID-Flux**: zero GPU ops; switch models with a one-line change; per-second billing fits a per-user feature.
- **Pinia store reset pattern in Imagine**: the modal embeds the singleton `ThreeViewer` and calls `viewerStore.reset()` on open/close/back so state never leaks back into `/editor/:id` if the user navigates there afterwards.

---

## Thank You

> **Visual:** closing slide. Dark teal-to-charcoal gradient background. Centered: the Corjl logo (upload `src/assets/corjl-logo.png`) above the tagline. Bottom-right corner: small "Rowboat Software" wordmark. Faint isometric grid pattern across the lower third in `#086674` at 10% opacity.

**Corjl try-it-on** — your design, your face, your product, your mockup.
Now everywhere you carry a phone.

---

**Corjl** · a product of **Rowboat Software**
*Built in ap-southeast-1 · Powered by AWS Serverless + Replicate*
