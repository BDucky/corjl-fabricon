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

- **9 bundled product models** (7 visible by default — tank top and cardboard box are flagged `hidden: true` in `BUNDLED_MODELS` until their UV layouts are polished): t-shirt, hoodie, polo, tote bag, coffee mug, phone case, standee (visible); tank top, cardboard box (hidden)
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

> **Visual:** schematic pipeline diagram. Two input nodes on the left (mockup PNG, face PNG) feed into a central router block labeled "IDM-VTON / PuLID-Flux" that branches by product type; output on the right is a framed result image. All in teal `#086674` strokes with gold `#F5B461` accent on the router block. Tiny ASCII-style ports/labels.

The signature feature. Four steps, one personalized image — **no prompt to type**.

1. **Pick a design** from the user's gallery (filtered to designs that actually have artwork)
2. **Pick a product + pose the 3D mockup** — the viewer is embedded in the modal; a chip strip lets the user switch between **T-Shirt / Polo / Hoodie**; capture button triggers a headless render
3. **Capture a face photo** via the phone camera — with an on-screen silhouette guide and an amber "is your chest visible?" warning
4. **Review & Generate** — two-thumbnail review, one-tap **Generate**, ~20–60s wait, result appears inline

→ Routed to **Replicate**. The product determines which model handles it (next slide). Prompts are **auto-generated per-product** from `src/services/imagine/promptBuilder.ts` so the user never has to write one. Result is shown inline; **persistence (S3 + ImagineJob row) is Step 4 of the plan, not yet shipped**.

---

## The Imagine Workflow

> **Visual:** full-width data-flow schematic, dark surface. Two input ports stacked vertically on the left feed a central "router" diamond labeled by product kind; the diamond branches into two parallel processor blocks (IDM-VTON for garments / PuLID-Flux for face-only), both routing into a single result block; result is shown inline on a phone outline. The IDM-VTON block is highlighted gold `#F5B461`. Dotted grid background, blueprint line weights, monospace labels.

```
┌─────────────────┐   ┌─────────────────┐
│  3D Mockup PNG  │   │   Face Photo    │     auto-prompt built
│  (cleanBg +     │   │  (Capacitor     │     per-product from
│   auto-frame)   │   │   Camera)       │     promptBuilder.ts
└────────┬────────┘   └────────┬────────┘
         │                     │
         └──────────┬──────────┘
                    ▼
            ╔═══════════════════╗
            ║   modelKind(id)   ║
            ╚═════════╤═════════╝
              garment │ face
       ┌──────────────┴───────────────┐
       ▼                              ▼
┌──────────────────┐         ┌──────────────────┐
│  IDM-VTON        │ ← gold  │  PuLID-Flux      │
│  (cuuupid/       │         │  (bytedance/     │
│   idm-vton)      │         │   flux-pulid)    │
│  garm_img +      │         │  face image +    │
│  human_img +     │         │  per-product     │
│  garment_des     │         │  prompt          │
└────────┬─────────┘         └────────┬─────────┘
         └──────────┬─────────────────┘
                    ▼
        ┌───────────────────────────┐
        │  poll /v1/predictions/:id │   2s · 5min timeout
        │  via CapacitorHttp        │
        └─────────────┬─────────────┘
                      ▼
            ╭───────────────────╮
            │  Inline preview   │   ← phone outline
            │  (Imagine modal)  │
            ╰───────────────────╯

      [Step 4 not shipped — no S3 upload, no ImagineJob row yet]
```

---

## Imagine — Today's Scope (Garment-First)

> **Visual:** product-grid mosaic on dark surface. Three teal-bordered tiles (T-Shirt / Polo / Hoodie) light up bright with a glow `rgba(8,102,116,0.30)`. Five tiles behind them (tote / mug / phone case / box / standee) are dimmed and stamped with a gold "later" badge `#F5B461`.

The Imagine picker shows **only garment-route models** today.

- **Visible**: T-Shirt · Polo · Hoodie (tank top is hidden; same route, not yet polished)
- **Hidden**: Tote · Coffee Mug · Phone Case · Cardboard Box · Standee

**Why scoped down (decision logged 2026-05-19):** Tote bag end-to-end test returned a Replicate **402** from PuLID-Flux ("must be less than or equal to 20" — image-count guard on the object route). Rather than burn iteration cycles tuning a route that doesn't preserve the design pixels anyway, we paused all non-garment products until the object pipeline is rebuilt.

**Code where it lives:** `src/components/imagine/ImagineCreateModal.vue`
```ts
const pickerModels = computed(() =>
  viewerStore.allModels.filter(
    (m) => m.bundled && !m.hidden && modelKind(m.id) === 'garment',
  ),
)
```

The `face` route in `replicateClient.ts` + the non-garment prompt templates in `promptBuilder.ts` are **kept as dead code** so the object pipeline can be revived without a re-port.

---

## Imagine — The Capture Pipeline (`captureBlob`)

> **Visual:** four-stage horizontal flow diagram, dark surface. Stage 1 = the 3D viewer with grid + ground shadow. Stage 2 = the same viewer with grid hidden, white background swapped in (label "cleanBackground"). Stage 3 = the viewer auto-zoomed onto the chest's print area (label "framePrintArea, ~80% fill"). Stage 4 = a flat 1024×1024 PNG suitable for IDM-VTON. Teal arrows between stages, monospace labels.

The mockup snapshot is **not** the same renderer the user sees — it's a two-step transform inside `src/modules/viewer3d/composables/useExporter.ts`.

**Step A — `cleanBackground: true`** (shipped earlier)
- Hides `__grid__`, `__scene_staging__`, `__ground_shadow__` helpers
- Swaps `scene.background` for solid white, `renderer.setClearColor(white, 1)`
- Result: a product-catalog-style image instead of a dark-themed viewer screenshot
- Why this matters: IDM-VTON couldn't extract the garment from a dark-background capture — output was a plain skin-tone top

**Step B — `framePrintArea: true`** (shipped 2026-05-19, Step 3.6 #1)
- New utility `framePrintArea.ts` walks each target mesh's `(uv, position)` attributes
- For every vertex whose UV lies inside `MODEL_TEXTURE_DEFAULTS[id].printAreaUV`, the world-space position is collected into a `THREE.Box3`
- Camera repositioned along +Z at the exact distance that fills `fillRatio` (default 0.8) of the frame at the export aspect
- Restored before the next render so the user's hand-set framing is preserved
- Why: IDM-VTON re-paints the garment; giving it more pixels of the actual design measurably improves fidelity in the output

Combined, these turn a hand-posed 3D scene into a flat, design-filled, high-pixel-density input that IDM-VTON can actually learn from.

---

## Imagine — The Auto-Prompt (No Free Text)

> **Visual:** before/after split. Left: a sad-looking blank textarea with the placeholder "describe the scene…". Right: a clean checkmark icon over a one-line reassurance string, with a faded list of 9 product templates behind it. Teal/gold callouts: "removed", "shipped".

The original Step 4 had a free-text prompt textarea. **Removed.**

**Why:** Letting customers type a prompt is poor UX — non-technical users either left it blank or wrote contradictory text. Replaced with auto-generated prompts that vary by 3D model.

**How it works (`src/services/imagine/promptBuilder.ts`):**

- **`TEMPLATES`** — one prompt string per product (`tshirt`, `polo`, `hoodie`, `tanktop`, `totebag`, `phonecase`, `coffeemug`, `cardboardbox`, `standee`)
- Every template emphasizes three things we can actually control:
  1. **FACE** — `"the exact same face, hair, and expression as the reference photo"`
  2. **PRODUCT** — the explicit noun, oriented toward the camera
  3. **"DESIGN EXISTS"** — `"a bold colorful printed graphic design clearly visible facing the camera"` — biases the model toward drawing *something* on the product, not a blank surface
- **`buildNegativePrompt()`** — discourages the failure modes we hit in early tests: `"blank product, plain unprinted surface, distorted face, multiple people, extra fingers, text watermark, cartoon, blurry"`
- **`buildGarmentDescription()`** — a short text hint passed to IDM-VTON's `garment_des` input ("A short-sleeve cotton t-shirt with a printed graphic on the front…")
- **`modelKind(id)`** classifies the active model into `'garment' | 'face'` — the router

**Honest limitation, surfaced in the UI:** the face route can't reproduce the design pixel-for-pixel. The Step 4 reassurance copy says that explicitly for non-garment products.

---

## Imagine — Why Single-Stage IDM-VTON (Not Two-Stage)

> **Visual:** A/B comparison panel on dark surface. Left: a "two-stage" flowchart (PuLID body-synth → IDM-VTON) with a red `#D63E36` strikethrough; small caption "face identity dropped". Right: a "single-stage" flowchart (IDM-VTON with real photo) in solid teal `#086674`; caption "face preserved · chest visibility required". Gold `#F5B461` accent on the single-stage block.

We tried generating a synthetic full-body photo first (PuLID-Flux body-synth) then feeding that to IDM-VTON. Result: the customer's face identity dropped noticeably on each stage's re-paint.

**Decision (2026-05-18):** revert to single-stage IDM-VTON with the user's **real** photo as `human_img`. Trade-off: the model can only draw the design where it can see the torso, so the **user's chest must be in frame**.

**How we mitigate the chest-visibility constraint in the UI:**
- **Silhouette guide SVG** at Step 3 — shows a head + shoulders + chest outline so the user knows what frame to take
- **Amber post-capture warning** — "Is your chest visible? The design only appears where the AI can see your torso. If your photo is head-only, the result will have a blank or empty shirt."
- Step 3 hint text adapts based on `isGarmentRoute`: garment route reads "Step back so your head, shoulders, and chest are all in frame"; non-garment reads "Use the camera or pick a photo from your gallery"

**IDM-VTON params we landed on:**
- `garm_img: <mockup data URI>` · `human_img: <face data URI>` · `garment_des: <per-product text>`
- `category: 'upper_body'` · `crop: false` · `seed: random()` · `steps: 30`

Step 3.6 #2 (not done) is the obvious next lever: `steps: 30 → 40`, `force_dc: true`.

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
2. **My Designs** tab — browse / upload designs (search + sort; type-filter UI was removed for simplicity)
3. Open a design → **3D Editor**: pick a product model, place artwork, light it, color it
4. **Export** a mockup PNG (single / multi-angle / turntable GIF), or…
5. Switch to **Imagine** tab → "Create new"
6. Pick a design → pick a product (garment chip strip: T-Shirt / Polo / Hoodie) → capture the mockup → take a face photo
7. Tap **Generate** — auto-prompt fires, Replicate runs the route (~20–60s), result appears inline
8. **Start over** to iterate, or close (gallery persistence ships in Step 4)

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
- ⚠️ **Today:** `VITE_REPLICATE_API_TOKEN` is bundled into the iOS app — fine for the dev TestFlight build, **not safe for public release**
- ⏳ **Step 5 (Lambda) before launch:** token lives in the Lambda's env vars; frontend creates an `ImagineJob` row, the Lambda reads it and calls Replicate

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
| 6 — **Imagine** AI try-on | 🟡 In progress (see below) |
| &nbsp;&nbsp;6.1 — 4-step modal flow (mobile-polished) | ✅ Shipped |
| &nbsp;&nbsp;6.2 — Replicate integration (CapacitorHttp + polling) | ✅ Shipped |
| &nbsp;&nbsp;6.3 — Per-product router (IDM-VTON / PuLID-Flux) | ✅ Shipped |
| &nbsp;&nbsp;6.4 — Auto-prompt (per-product templates) | ✅ Shipped |
| &nbsp;&nbsp;6.5 — `cleanBackground` + auto-frame capture (Step 3.6 #1) | ✅ Shipped |
| &nbsp;&nbsp;6.6 — Garment-only scope (object route paused on Replicate 402) | ✅ Shipped |
| &nbsp;&nbsp;6.7 — Tune IDM-VTON params (`steps: 40`, `force_dc: true` — Step 3.6 #2) | ⏳ Next |
| &nbsp;&nbsp;6.8 — S3 persistence + ImagineJob row (Step 4) | ⏳ Planned |
| &nbsp;&nbsp;6.9 — Lambda proxy for Replicate token (Step 5) | ⏳ Planned |
| &nbsp;&nbsp;6.10 — Replace IDM-VTON / Flux for commercial license | ⚠️ Blocker before launch |
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

- **`appId: com.corjl.fabricon`**, **`appName: Fabricon`**, **`webDir: dist`**
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

> **Visual:** sequence diagram in the style of a UML/timing chart. Vertical lifelines (left → right): `User`, `ImagineModal`, `ThreeViewer`, `Capacitor.Camera`, `CapacitorHttp`, `Replicate · /models`, `Replicate · /predictions`. Numbered horizontal arrows show the message order. Teal strokes on dark surface, monospace labels, blueprint grid background.

**File map (what's actually shipped on `feat/camera-imagine`):**
- `src/views/MyDesignsView.vue` — Imagine tab + "Create new" CTA, route-query state (`?tab=imagine`)
- `src/components/imagine/ImagineCreateModal.vue` — 4-step Teleport-mounted modal (stepper bar, Back/Close, sticky bottom CTAs with `pb-safe-b`)
- `src/services/imagine/captureFace.ts` — Capacitor Camera → `File` + preview URL, with explicit cancel-detection
- `src/modules/viewer3d/composables/useExporter.ts` — `captureBlob({ width, height, transparent, cleanBackground, framePrintArea })`
- `src/modules/viewer3d/utils/framePrintArea.ts` — print-area AABB → camera repositioning
- `src/services/imagine/replicateClient.ts` — the router + model-resolution + polling
- `src/services/imagine/promptBuilder.ts` — `MODEL_KIND`, `modelKind()`, per-product `TEMPLATES`, `buildGarmentDescription()`, `buildNegativePrompt()`

**Sequence on Generate (today):**
1. User picks a design → `viewerStore.setDesignFromUrl(thumbnailUrl)`; the aspect-matcher's pick is overridden to a garment if it landed on a non-garment.
2. User picks a product via the chip strip → `viewerStore.selectModel(id)`; texture mapper re-binds the design.
3. User taps **Capture & continue** → `captureBlob({ width: 1024, height: 1024, cleanBackground: true, framePrintArea: isGarmentRoute })` returns a flat, design-filled PNG.
4. User taps **Take photo** → `captureFacePhoto()` → Capacitor Camera (`source: Prompt`) → `Blob` → `File` + `objectURL` preview.
5. User taps **Generate** → `generateImage({ modelId, mockupImage, faceImage })`:
   - Both blobs → `blobToDataUri()` (chunked `arrayBuffer` + `btoa`; avoids `FileReader` for ESLint-allowlist reasons)
   - `modelKind(modelId) === 'garment'` → `generateGarment()` route (IDM-VTON)
   - Else → `generateFace()` route (PuLID-Flux) — currently unreachable from the UI; see "Scope" slide
6. **Model resolution:** `GET /v1/models/{slug}` → cache `latest_version.id` per session. We use `/v1/predictions` (not `/v1/models/{slug}/predictions`) because that endpoint is restricted to Replicate's official models — community models 404.
7. **Create + poll:** `POST /v1/predictions { version, input }`; then `GET /v1/predictions/{id}` every 2s until `succeeded` / `failed` / `canceled`, with a 5-minute timeout. Returns the first output URL.
8. UI swaps Step 4 for an inline result view with **Start over** + **Done** CTAs.
9. **Not yet shipped:** S3 persistence + ImagineJob row (Step 4 of the plan) and Lambda proxy (Step 5).

**Why `CapacitorHttp` instead of `fetch`?** Browser CORS would block the Replicate calls from inside the WebView. `CapacitorHttp` runs the request through native Swift/Kotlin, bypassing the WebView's CORS layer entirely.

---

## Deep Tech — AI Model Choice (Per-Product Router)

> **Visual:** decision-tree diagram. Top node = "modelKind(modelId)". Left branch (garment) leads to a teal box "cuuupid/idm-vton" with inputs `garm_img + human_img + garment_des`. Right branch (face) leads to a dimmer box "bytedance/flux-pulid" with `main_face_image + prompt + negative_prompt`. Gold `#F5B461` accent on the garment branch (the route shipped today). Monospace labels.

There's **no single best try-on model** for both clothing and physical objects, so the router in `replicateClient.ts` picks per product.

**Garment route — `cuuupid/idm-vton`** (T-Shirt, Polo, Hoodie, Tank Top)
- *What it does:* True virtual try-on — takes the garment image and the person image, re-paints the garment onto the person while preserving identity.
- *Inputs:* `garm_img` (the cleanBg + auto-framed mockup) · `human_img` (the user's real photo) · `garment_des` (per-product text hint) · `category: 'upper_body'` · `crop: false` · `seed: random()` · `steps: 30`
- *Why this one:* The only Replicate model that takes BOTH a garment image AND a human image and preserves both. PuLID is face-only; SDXL with IP-Adapter doesn't preserve design pixels.
- *Limitation:* Re-paints the garment — fine details (logos, text) get smudged. Step 3.6 #1 (auto-frame) ships today as the first mitigation.
- ⚠️ **License: CC BY-NC-SA 4.0.** Must be replaced before commercial launch.

**Face route — `bytedance/flux-pulid`** (everything else — currently unreachable from the UI)
- *What it does:* Face-identity-preserving diffusion — injects facial identity features into Flux at every denoising step.
- *Inputs:* `prompt` (per-product template) · `negative_prompt` · `main_face_image` · `id_weight: 1` · `guidance_scale: 6` · `num_steps: 28` · `output_format: 'png'`
- *Why this one for objects:* Object products (mug, tote, phone case) have no try-on model that preserves their design. PuLID at least preserves the face and frames the product naturally.
- *Honest limitation:* The design pixels are NOT preserved — the model can't see the mockup. Surfaced in the Step 4 reassurance copy.
- ⚠️ **License: Flux.1-dev is also non-commercial.** Same blocker as IDM-VTON.

**Why Replicate over self-hosting either model:**
- Zero GPU ops — no model weights to host, no autoscaler to tune
- One uniform HTTP API for both models — swap by changing one env var (`VITE_REPLICATE_MODEL_GARMENT` / `VITE_REPLICATE_MODEL_FACE`)
- Per-second billing fits a per-user feature where load is unpredictable
- Trade-off: cold-start latency and a license blocker we still need to clear

---

## Deep Tech — The Auto-Frame Algorithm (`framePrintArea`)

> **Visual:** annotated 3D scene diagram. A tshirt mesh on the left in default pose with a small print region highlighted gold. A right-arrow labeled "framePrintArea(0.8)". Right side: the same mesh viewed straight-on from +Z with the chest print region filling ~80% of the frame. Annotation callouts in monospace: `target meshes · UV ∈ printAreaUV · world AABB · +Z distance · controls.update()`.

The Step 3.6 #1 fix that shipped on 2026-05-19. New utility in `src/modules/viewer3d/utils/framePrintArea.ts`.

**The problem it solves.** A hand-posed 3D capture sends IDM-VTON a tiny chest patch inside a full-body mockup. The model has very few pixels of the actual design to learn from, so the design comes out smudged.

**The algorithm:**
1. Resolve the active model's target meshes via `targetMeshNames` + `targetMaterialNames`.
2. For each mesh, iterate `(uv, position)` BufferAttributes. For every vertex whose UV lies inside `MODEL_TEXTURE_DEFAULTS[id].printAreaUV`, transform `position` by `mesh.matrixWorld` and `expandByPoint()` a `THREE.Box3`.
3. Compute the box's `center` + `size`. Using `camera.fov` and the export aspect, calculate the distance along +Z that makes the box fill `fillRatio` (0.8) of the rendered frame in both axes; pick the max of the two (whichever dimension would overflow first) and add `size.z / 2 + 0.1` so the back of the curved chest doesn't clip the near plane.
4. `camera.position.set(center.x, center.y, center.z + distance)`, `controls.target.copy(center)`, `controls.update()`, `camera.updateProjectionMatrix()`.
5. Return a `FrameRestoreState` `{ position, target, aspect }`; `captureBlob` restores it after `toBlob()` resolves.

**Returns `null` (caller falls back to user's framing) when:** no target meshes match, the meshes have no UV/position attributes, or no vertices fall inside `printAreaUV`. Defensive against weird user-uploaded models.

**Only fires for garments** (`framePrintArea: isGarmentRoute.value` in the modal). Non-garment captures keep the user's framing — the print-area concept doesn't generalize cleanly to wrap-around products like mugs anyway.

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
| Imagine — pick design | `ImagineCreateModal` step 1 | — | — | designs from AppSync (filtered to `thumbnailFilePath !== null`) | — |
| Imagine — pick product + capture | `ImagineCreateModal` step 2 (chip strip, embedded ThreeViewer) | `useExporter.captureBlob({ cleanBackground, framePrintArea })`, `framePrintArea.ts` | — | — | — |
| Imagine — face capture | `captureFace.ts` (with silhouette guide + chest warning) | `URL.createObjectURL` preview | `@capacitor/camera` (`source: Prompt`) | — | — |
| Imagine — auto-prompt | `promptBuilder.ts` | — | — | — | per-product `TEMPLATES` + `negative_prompt` + `garment_des` |
| Imagine — router + generate | `replicateClient.ts` (shipped, client-side) | — | `@capacitor/core` `CapacitorHttp` (bypasses WebView CORS) | — | Replicate · IDM-VTON (garment) / PuLID-Flux (face — UI hidden) |
| Imagine — result | inline preview in modal (Start over / Done) | — | — | — | — |
| Imagine — persistence (planned) | — | — | — | S3 + AppSync (`ImagineJob`) | — |
| Imagine — token security (planned) | — | — | — | Amplify Function (Lambda) | — |

---

## Deep Tech — Why These Choices

- **Vue 3 + Vite + Pinia over React/Next**: smaller bundle, simpler SFC ergonomics, and `<script setup>` keeps the imperative Three.js layer cleanly separated from reactive UI. Pinia stores compose like hooks without the dependency-array footguns.
- **Three.js over Babylon.js**: lighter, more mature for static product rendering, larger ecosystem for `GLTFLoader` + `OrbitControls` + post-processing.
- **Capacitor over React Native / native rewrite**: literally the same Vue codebase ships to web + iOS + Android. Critical for a small team.
- **AWS Amplify Gen 2 over Gen 1**: code-first TypeScript (`defineAuth`, `defineData`, `defineStorage`) instead of an interactive CLI; per-environment sandboxes; no `amplify-cli` global drift.
- **AppSync over a REST API**: typed schema, generated client, field-level `@auth`, real-time subscriptions available for free when we need them.
- **Replicate over self-hosting the AI models**: zero GPU ops; switch models with a one-line env-var change; per-second billing fits a per-user feature with unpredictable load.
- **Per-product router (IDM-VTON + PuLID) over a single model**: no single model preserves both face identity AND printed design pixels across both garments and physical objects. The router picks the best fit per product; the UI copy is honest about what each route can and cannot preserve.
- **Single-stage IDM-VTON over a two-stage PuLID→IDM-VTON pipeline**: two-stage drops face identity on each re-paint. Single-stage with the user's real photo preserves the face exactly; the chest-visibility constraint is mitigated with a silhouette guide and an amber warning in the UI.
- **Auto-prompt over a free-text prompt input**: non-technical users either leave the prompt blank or write contradictory text. Auto-generated per-product templates (`promptBuilder.ts`) emphasize the three things the model can actually control (face / product / "design exists") and stay consistent across runs.
- **`CapacitorHttp` over `fetch` for Replicate**: the WebView's CORS layer blocks Replicate's API; CapacitorHttp routes through native code and bypasses it.
- **`/v1/predictions` + resolved version SHA over `/v1/models/{slug}/predictions`**: the slug endpoint is restricted to Replicate's official models — community models 404. We `GET /v1/models/{slug}` once per session, cache `latest_version.id`, then POST with `{ version, input }`.
- **`cleanBackground` + `framePrintArea` capture mode** (not the existing renderer): IDM-VTON couldn't extract the garment from a dark-themed viewer capture (output was a plain skin-tone top). Hiding helpers, swapping in white, and auto-zooming to the print area turns the same scene into a flat product-catalog-style image with high pixel density on the design.
- **Pinia store reset pattern in Imagine**: the modal embeds the singleton `ThreeViewer` and calls `viewerStore.reset()` on open/close/back so state never leaks back into `/editor/:id` if the user navigates there afterwards.

---

## Thank You

> **Visual:** closing slide. Dark teal-to-charcoal gradient background. Centered: the Corjl logo (upload `src/assets/corjl-logo.png`) above the tagline. Bottom-right corner: small "Rowboat Software" wordmark. Faint isometric grid pattern across the lower third in `#086674` at 10% opacity.

**Corjl try-it-on** — your design, your face, your product, your mockup.
Now everywhere you carry a phone.

---

**Corjl** · a product of **Rowboat Software**
*Built in ap-southeast-1 · Powered by AWS Serverless + Replicate*
