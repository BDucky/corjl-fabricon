# Corjl try-it-on — Tech Study Guide

A demo-prep reference. Goal: after reading this, you can answer almost any question someone throws at you about the infrastructure, tech stack, and architecture choices.

---

## Part 1 — The One-Paragraph Mental Model

Corjl try-it-on is a **Vue 3 single-page app** that uses **Three.js** for live 3D product mockups and **Capacitor** to ship the same web code as native iOS/Android apps. The backend is **AWS serverless**: **Cognito** authenticates users, **AppSync** exposes a GraphQL API backed by **DynamoDB**, and **S3** stores design files and AI-generated images. The signature feature, **"Imagine"**, takes a 3D mockup snapshot plus a face photo plus a text prompt and calls **Replicate (PuLID-Flux)** to generate a personalized AI image of the user wearing the product. Today the Replicate call is client-side for prototyping; before mobile ship it moves to a **Lambda** so the API key never leaves AWS.

If you can say *that* paragraph confidently, you have the 80% answer for any high-level question.

---

## Part 2 — End-to-End Request Flow (the "what happens when..." answers)

### When a user signs in
1. They type email + password in `LoginView.vue`
2. The `auth` Pinia store (`src/stores/auth.ts`) calls `signIn` from `aws-amplify/auth`
3. Amplify hits **Cognito User Pool** (`amplify/auth/resource.ts`) — Cognito verifies the password and returns a JWT
4. JWT is stored in `localStorage`; `auth.isAuthenticated = true`
5. Router guard lets them into `/designs`

### When a user opens a design in the 3D editor
1. Route `/editor/:designId` mounts `EditorView.vue`
2. The `designs` Pinia store queries **AppSync** for the design row
3. AppSync's resolver hits **DynamoDB**, returns the row including the S3 key of the image
4. `useTextureMapper` fetches the image URL, draws it onto a `<canvas>`, wraps it in a `THREE.CanvasTexture`
5. `useModelLoader` loads a `.glb` from `public/models/` with `GLTFLoader`
6. The texture is bound to the target mesh's material; the user sees their design on the product

### When a user clicks "Generate" in the Imagine flow
1. Step 1: pick a design — pulled from `designs` store
2. Step 2: snapshot mockup — `ThreeViewer.captureBlob({ transparent: true })` does a headless render and returns a PNG `Blob`
3. Step 3: take a face photo — `captureFacePhoto()` calls `@capacitor/camera`, returns a `File` + preview URL
4. Step 4: write a prompt — plain `<textarea>` binding
5. Submit (currently `console.log`, soon Replicate):
   - **Step 3 plan:** POST blobs + prompt directly to Replicate from the browser
   - **Step 4 plan:** upload blobs to S3 first; create an `ImagineJob` row in DynamoDB with `status: PENDING`
   - **Step 5 plan:** the Replicate call moves into a Lambda; frontend just creates the job and subscribes to its status

---

## Part 3 — Deep Dive: The Phone Layer (Capacitor)

### What Capacitor actually is
Capacitor is a **native runtime** that wraps a `WKWebView` (iOS) or `WebView` (Android) and exposes a JS bridge to native APIs. Your Vue app runs unchanged inside that web view; when you call `Camera.getPhoto()`, the JS bridge marshals the call to native Swift/Kotlin code, which opens the real system camera and posts the photo back.

**Why not React Native?** RN renders to *native* widgets via a different bridge. We don't need that — we need the *same* web UI on all platforms plus access to camera/filesystem. Capacitor wins on code reuse.

**Why not Cordova/Ionic Classic?** Capacitor is the modern successor — better TypeScript support, drop-in for any web framework, owned by the Ionic team.

### Our Capacitor config (`capacitor.config.ts`)
- `appId: com.corjl.fabricon` — reverse-DNS bundle ID, also the iOS bundle and Android package
- `appName: Fabricon` — display name on home screen
- `webDir: dist` — Vite's build output; this is what gets bundled into the native shell for App Store / Play Store
- `server.url` — when `CAPACITOR_SERVER_URL` env var is set, the app **loads from the Vite dev server over LAN** instead of the bundled `dist/`. This gives you hot reload on the iPhone while developing. Unset for release builds.
- `cleartext: true` (only when dev URL is set) — allows HTTP for local dev server
- `androidScheme: 'https'` — Android web view uses `https://` even for local content

### Plugins we use
| Plugin | Used for |
|---|---|
| `@capacitor/camera` | Photo capture in design upload + Imagine face capture |
| `@capacitor/filesystem` | Saving downloads locally |
| `@capacitor/status-bar` | Dark theme, overlays the web view edge-to-edge |
| `@capacitor/keyboard` | `resizeOnFullScreen: true` so inputs aren't hidden |
| `@capacitor/splash-screen` | 3-second launch screen on cold start |
| `@capacitor/app` | App lifecycle hooks (background/foreground) |

### The dev loop on a real iPhone
1. Set `CAPACITOR_SERVER_URL=http://<mac-lan-ip>:5173` in `.env`
2. `pnpm dev` (Vite on Mac, listening on `0.0.0.0`)
3. `pnpm capacitor:sync` — copies config to iOS project
4. `pnpm capacitor:open:ios` — opens Xcode
5. Plug phone, trust, enable Developer Mode, hit Run
6. App opens, loads from your Mac — every save in Vue triggers HMR on the phone

For TestFlight: unset `CAPACITOR_SERVER_URL`, `pnpm build`, `pnpm capacitor:sync`, Archive in Xcode.

---

## Part 4 — Deep Dive: The Web Layer (Vue 3 + Vite + Pinia)

### Vue 3 with Composition API + `<script setup>`
Every component is a single-file component (`.vue`) using `<script setup lang="ts">`. Why:
- **Composition API** = logic is plain TypeScript functions, not tied to component options. You can extract `useThreeScene()` and unit-test it.
- **`<script setup>`** = top-level `ref`, `computed`, `watch` calls become reactive without `export default { setup() { ... } }` boilerplate
- **Vue's reactivity** is proxy-based — assignment to a `.value` ref triggers re-render. We use it sparingly around Three.js because Three.js is imperative; we keep the Vue reactive surface small.

### TypeScript strict mode
`tsconfig.json` runs with `strict: true`. Implications:
- `null`/`undefined` are not silently allowed — every nullable variable is `Type | null`
- Function parameters must be typed
- `noImplicitAny` is on
- We pay this tax once, then never debug a "cannot read property of undefined" again

### Vite
- **Dev server** uses native ES modules — no bundle in dev, so HMR is near-instant
- **Build** uses Rollup with our custom `manualChunks` config:
  - `vendor-vue`: vue, vue-router, pinia (~70KB gzipped)
  - `vendor-three`: three (~150KB gzipped — the biggest chunk)
  - `vendor-aws`: aws-amplify + auth + ui-vue
  - Splitting these means a UI-only code change doesn't invalidate the Three.js bundle in the browser cache
- **Path aliases** (`@/`, `@modules/`, `@services/`, `@stores/`) — defined in both `vite.config.ts` and `tsconfig.json`

### Pinia stores
Pinia is the official Vue 3 state management library, replacing Vuex.

| Store | Path | Holds |
|---|---|---|
| `auth` | `src/stores/auth.ts` | user, JWT, isAuthenticated, signIn/signOut actions |
| `designs` | `src/stores/designs.ts` | the user's designs from AppSync, loading state |
| `viewer3d` | `src/modules/viewer3d/store.ts` | active model, design URL, lighting/camera presets, export settings |

**Pattern:** stores are *plain composable functions* (`useAuthStore()`). State is a `ref`/`reactive`; actions are plain methods. There's no mutation/action ceremony like Vuex.

### Tailwind CSS
- Utility-first CSS in class names — `flex items-center gap-3 rounded-lg bg-surface-1`
- We've themed with CSS custom properties (`var(--text-primary)`, `var(--border-subtle)`) so the dark theme can swap without rewriting markup
- Safe-area utilities (`pt-safe`, `pb-safe`) for notched devices

---

## Part 5 — Deep Dive: The 3D Engine (Three.js)

Three.js is a low-level WebGL wrapper. It doesn't make decisions for you — you build your own scene graph, camera, renderer, lighting, controls, and animation loop. That's why we have so many composables: each one wraps one slice of Three.js into a reusable hook.

### The scene graph (`useThreeScene.ts`)
```
Scene
├── PerspectiveCamera (45° FOV, position [2.1, 1.5, 2.1], looking at origin)
├── WebGLRenderer (in a <canvas> inside the component's container div)
│   ├── antialias: true
│   ├── preserveDrawingBuffer: true   ← critical for snapshot export
│   ├── alpha: true                    ← transparent background option
│   ├── pixelRatio: min(devicePixelRatio, 2)   ← cap on retina for perf
│   ├── toneMapping: ACESFilmicToneMapping
│   ├── outputColorSpace: SRGBColorSpace
│   └── shadowMap: PCFSoftShadowMap
├── OrbitControls (mouse/touch orbit around the model)
│   ├── enableDamping: true (smooth deceleration)
│   ├── dampingFactor: 0.08
│   ├── minDistance: 0.5, maxDistance: 20
└── Animation loop: requestAnimationFrame → controls.update() → renderer.render(scene, camera)
```

Plus a `ResizeObserver` on the container element — every container resize updates camera aspect ratio and renderer size.

### Why `preserveDrawingBuffer: true`
Normally, WebGL clears the canvas after a frame to free GPU memory. If you call `canvas.toBlob()` after that, you get a blank PNG. Setting `preserveDrawingBuffer: true` keeps the last rendered frame's pixels readable. This is what makes our PNG export and Imagine snapshot work.

### Texture mapping pipeline (the hardest part to explain)
A flat user image becomes a correctly-placed texture on a curved 3D garment via this chain:

1. **UV unwrap of the model** — every vertex of the GLB has a `uv` attribute (a 2D coordinate in [0,1] saying "where on a 2D image am I?"). Modelers create this unwrap in Blender; we read it.
2. **`computeUVBounds`** — walk the target mesh's `uv` buffer and find min/max U and V. That's the printable region in texture space.
3. **`generatePlanarUVs` / `generateCylindricalUVs`** — fallback if the GLB doesn't have usable UVs (some user-uploaded models won't). Planar = project from one axis (good for t-shirt front). Cylindrical = wrap around an axis (good for mugs).
4. **`textureCompositor`** — creates a `<canvas>` sized to a fixed texture resolution (e.g., 2048×2048). Draws the user's image at the offset/scale matching the UV bounds.
5. **`THREE.CanvasTexture`** wraps that canvas. The texture's pixels = the canvas's pixels.
6. **`useTextureMapper`** finds the target meshes (by name from `activeModel.targetMeshNames`), saves their original `MeshStandardMaterial.color` (so we can restore on clear), and assigns the canvas texture as the material's `.map`.
7. When the user drags to reposition, we **re-draw the compositor canvas** at a new offset and set `texture.needsUpdate = true`. Three.js re-uploads the canvas to the GPU on the next frame.

**Why a canvas in the middle?** Re-painting a canvas is cheap. Re-uploading the user's original (potentially 4K) image to the GPU on every drag would be slow.

### The 9 models in `public/models/`
- `tshirt.glb`, `polo.glb`, `tanktop.glb`, `hoodie.glb` — apparel, planar UV on front
- `toteBag.glb` — planar UV on front panel
- `coffeeMug.glb` — cylindrical UV around the body
- `phoneCase.glb` — planar on the back
- `cardboardBox.glb` — multi-panel UV
- `standee.glb` — flat cutout

Each is loaded with `GLTFLoader` (Three.js extra in `three/examples/jsm/loaders/GLTFLoader.js`).

### Lighting setup (`useLighting.ts`)
Three.js doesn't ship "Studio mode" — we built it. Each preset is a combination of:
- `AmbientLight` (uniform fill, no shadows)
- `DirectionalLight` (sun-like, casts shadows)
- One or two `DirectionalLight`s as rim/back lights

Plus the renderer's `ACESFilmicToneMapping` and `MeshStandardMaterial`'s PBR shader gives the metallic/roughness look.

### Camera presets and orbit
`useCameraPresets.ts` stores `{ position, target }` pairs. Switching a preset tweens the camera position over ~600ms while OrbitControls' damping smooths the visual result.

### Export and turntable
- **Single PNG**: `useExporter.exportImage()` → `captureBlob()` → headless render at user-chosen resolution → `toBlob('image/png')` → triggers a download via an `<a download>` click
- **Multi-angle**: `useMultiAngleExport.ts` loops camera presets, calls `captureBlob` per angle, zips with `fflate`
- **Turntable GIF**: `useTurntableExport.ts` rotates the model frame by frame, captures, encodes via `gifenc`

### Memory hygiene (`utils/dispose.ts`)
Three.js does **not** garbage-collect GPU resources automatically. When we unload a model we walk the scene graph and call `.dispose()` on every geometry, material, and texture. Skipping this leaks GPU memory and crashes mobile after a few model switches.

---

## Part 6 — Deep Dive: Authentication (AWS Cognito)

### What Cognito is
A managed user-pool service. It stores user records, hashes passwords (Argon2-grade), handles email verification codes, password resets, refresh tokens, and emits JWTs you can verify offline. AWS-equivalent of Auth0 or Firebase Auth.

### Our setup (`amplify/auth/resource.ts`)
```ts
defineAuth({
  loginWith: { email: { verificationEmailStyle: 'CODE' } },
  accountRecovery: 'EMAIL_ONLY',
  mfa: { status: 'OFF' },
  passwordPolicy: {
    minLength: 12,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialCharacters: true,
  },
})
```
- Email-based login (no usernames)
- 12-char password floor + complexity rules
- Email-code verification at signup
- MFA off today (would enable for production)

### The frontend (`src/stores/auth.ts`)
- Wraps `aws-amplify/auth`'s `signIn`, `signUp`, `confirmSignUp`, `signOut`, `resetPassword`
- Stores the JWT in `localStorage` (key: `corjl_auth_token`)
- On app boot, `main.ts` calls `authStore.initialize()` which checks token validity and refreshes if needed
- A computed `isAuthenticated` is used by the router beforeEach guard to redirect unauthenticated users to `/login`

### Why JWT in localStorage instead of httpOnly cookie?
Two reasons:
1. AppSync expects the JWT in an `Authorization` header — easier with localStorage than cookie + CSRF token
2. Capacitor's web view doesn't have a meaningful concept of httpOnly cookies anyway

The XSS risk is mitigated by Vue's automatic HTML escaping; we don't render any user-supplied HTML without sanitization.

---

## Part 7 — Deep Dive: The Data API (AppSync + GraphQL + DynamoDB)

### What AppSync is
A managed GraphQL service. You define a schema; AWS spins up resolvers that map GraphQL operations to data sources (DynamoDB, Lambda, HTTP, etc.). For us, every resolver hits DynamoDB.

### Our schema (`amplify/data/schema.ts`)
Five models, all owner-scoped with `@auth(rules: [{ allow: owner }])`:

| Model | Purpose | Key fields |
|---|---|---|
| `UserProfile` | User row | subscriptionTier (FREE/PRO/ENTERPRISE), preferences (JSON) |
| `DesignTemplate` | Reusable product templates | modelUrl, modelThumbnailUrl, uvMappingData, isPublic |
| `DesignProject` | User's working project | name, templateId, canvasData, status (DRAFT/PUBLISHED) |
| `ProjectAsset` | Uploaded files | type (IMAGE/FONT/MODEL/TEXTURE), fileSize, mimeType |
| `ProjectExport` | Export history | type (PNG/PDF/JPEG/SVG/GLB), fileUrl |
| `ImagineJob` (planned) | AI try-on jobs | designId, mockupKey, faceKey, prompt, status, resultKey |

### Why GraphQL over REST
- **One round-trip per screen** — fetch a design plus its assets plus the user profile in one request
- **Typed contract** — codegen generates TypeScript types from the schema
- **Subscriptions for free** — when ImagineJob status changes, the gallery updates without polling

### Authorization
`@auth(rules: [{ allow: owner }])` tells AppSync to inject a filter on the resolver: only return rows where `owner == $context.identity.sub` (the Cognito user ID). Users physically cannot see each other's data even if they crafted a malicious query.

### DynamoDB
- NoSQL key-value store, single-digit-millisecond reads at any scale
- On-demand pricing — no capacity planning, pay per request
- Per-model tables (Amplify creates one DynamoDB table per GraphQL model)
- Indexes on `owner` for "list mine" queries

---

## Part 8 — Deep Dive: Storage (S3)

### Three access tiers, one bucket (`amplify/storage/resource.ts`)
| Prefix | Read | Write | Use |
|---|---|---|---|
| `public/*` | Anyone (guest + auth) | Curated | Templates, demo assets |
| `protected/{identity_id}/*` | Owner + other auth users | Owner only | Design previews (sharable) |
| `private/{identity_id}/*` | Owner only | Owner only | Original uploads, AI inputs |

`{identity_id}` is the Cognito Identity Pool ID for the signed-in user. Amplify generates IAM policies that bind path access to identity at the bucket level — even if our app had a bug, S3 itself would reject a cross-user read.

### How uploads work (`src/services/s3.ts`)
```ts
new S3Client({ region: 'ap-southeast-1' })
new PutObjectCommand({ Bucket, Key, Body, ContentType })
```
- `uploadToS3(key, file)` — generic upload
- `uploadCanvasAsImage(canvas, key)` — `canvas.toBlob('image/png')` → upload
- `getSignedUrl(key, expiresIn)` — pre-signed URL for private GETs

### Why direct SDK calls instead of Amplify Storage helpers?
Amplify's `Storage.put()` works but couples us tightly to Amplify's identity-pool wiring. Using the bare SDK is more explicit and easier to migrate if we ever move off Amplify.

---

## Part 9 — Deep Dive: The Imagine AI Pipeline

### The big picture
The user has three things:
- A **3D mockup** (their product with their design)
- A **face photo** (themselves)
- A **prompt** (the scene/style they want)

We want: a single image where the *same face* is wearing/using the *same product* in the *prompted scene*.

### Why this is hard
Plain Stable Diffusion can do "person wearing a hoodie in Tokyo" — but the person and the hoodie are *random*. We need both to be **identity-preserving**: the model has to be told "this *specific* face" and "this *specific* product print".

### PuLID-Flux
- **Flux** = a recent diffusion model architecture, very good prompt fidelity
- **PuLID** = Pure and Lightning ID — a face-conditioning method that injects facial identity features into the diffusion process *without* drifting the rest of the scene
- Combined: PuLID-Flux gives us "this face" + "this scene" with much higher identity preservation than IP-Adapter or vanilla SDXL

### Why Replicate
- Pay-per-second of GPU inference, no model hosting
- One HTTP API for hundreds of models — `POST /predictions` with model version + inputs, poll until `succeeded`
- We can swap PuLID-Flux for InstantID (fallback) by changing the model version string

### Token security
Today the Replicate token is in `VITE_REPLICATE_API_TOKEN` — fine for dev, **catastrophic** if shipped to a mobile app (token would be extractable from the bundle). Step 5 of the Imagine plan moves the call to an Amplify Function (Lambda) — the token lives in the Lambda's env vars, frontend just creates the job and the Lambda polls Replicate.

### The persistence flow (Step 4, planned)
1. User submits → frontend uploads mockup PNG + face PNG to `private/{identity_id}/imagine/{job_id}/`
2. Creates `ImagineJob` row: `{ status: PENDING, mockupKey, faceKey, prompt }`
3. Lambda fires (triggered by job creation or invoked by frontend), calls Replicate, polls
4. On success: uploads result to `protected/{identity_id}/imagine/{job_id}/result.png`, updates row to `status: SUCCEEDED, resultKey: ...`
5. Imagine gallery tab subscribes to job changes via AppSync — UI updates in real time

---

## Part 10 — Cross-Cutting Concerns

### State management philosophy
- **Pinia stores** = cross-component state (auth, designs, viewer3d settings)
- **Component refs** = local UI state (modal open/close, form fields)
- **Route query** = shareable, refresh-survivable state (the Imagine tab uses `?tab=imagine`)
- **localStorage** = persistent across sessions (JWT, last-used model)

### Error handling
- Network/API errors caught in the calling Pinia action → exposed as `store.error`
- UI surfaces errors via the shared `LoadingOverlay` pattern (loading/error/empty/success states)
- Capacitor errors (e.g., camera cancellation) are caught specifically and treated as expected, not exceptions

### Performance budget
- **60fps** in the 3D viewer (we render via RAF, controls.update + renderer.render per frame)
- **<250KB gzipped initial JS** — enforced by vendor chunk splitting + lazy routes
- **<3s project load** — driven by lazy loading the editor module and parallel GLB + design image fetch

### Mobile performance
- Texture cap at 2048×2048
- Cap `devicePixelRatio` at 2 (prevents 3× on iPhone Pro Max from melting the GPU)
- `PCFSoftShadowMap` is acceptable on modern phones; we'd downgrade to a contact-shadow plane on older devices

### Security model
| Layer | Defense |
|---|---|
| Network | HTTPS everywhere (Cognito, AppSync, S3); Capacitor `androidScheme: 'https'` |
| Auth | Cognito JWT, 12-char password, email verification |
| API | AppSync `@auth(owner)` — DB-level row filtering |
| Storage | S3 prefix-based IAM (path = identity) |
| Frontend | TypeScript strict + Vue's auto-escaping prevents most XSS |
| Secrets | Replicate token will move to Lambda env vars (not shipped to mobile) |

---

## Part 11 — Demo Q&A (50+ likely questions with model answers)

### Product / Vision

**Q: What problem does Corjl try-it-on solve?**
A: Existing mockup tools show generic stock photos. We give designers and small sellers a real 3D preview of their artwork on the product, plus an AI image of the actual customer wearing it. End-to-end on a phone.

**Q: Who's the target user?**
A: Print-on-demand sellers, indie designers, small merch brands, and gift shops. Anyone who needs to show a customer what they'll get before paying.

**Q: How is this different from Printful or Printify mockups?**
A: They use pre-rendered stock photos. We render live 3D — orbit, light, color — and we generate AI images with the actual customer's face. Different product category.

**Q: What's the moat?**
A: The combined 3D + AI + mobile pipeline. Plenty of tools do 3D mockups; plenty do AI face generation; almost none do both, mobile-first, in one flow.

### Architecture

**Q: Why a single-page app instead of server-rendered?**
A: The 3D viewer is heavily interactive — orbiting, dragging textures, switching lighting. SSR doesn't help interactive WebGL. SPA + good code splitting is the right shape.

**Q: Why Vue 3 instead of React?**
A: Smaller bundle, simpler SFC ergonomics, and `<script setup>` keeps the imperative Three.js layer cleanly separated from reactive UI. Team familiarity also played a role.

**Q: Why Capacitor instead of React Native?**
A: Capacitor lets us ship literally the same Vue code to web, iOS, and Android. RN would require a parallel native UI codebase. For a small team that's a huge multiplier.

**Q: Why AWS instead of Firebase?**
A: We need fine-grained S3 access for design files and AI inputs, GraphQL with field-level auth, and serverless Lambdas for the Replicate proxy. AWS does all of these natively and the per-service pricing is cheaper at our scale.

**Q: Why Amplify Gen 2 over Gen 1?**
A: Gen 2 is code-first TypeScript (`defineAuth`, `defineData`, `defineStorage`) — no interactive CLI, no environment drift, sandboxes are isolated per developer.

### 3D / Three.js

**Q: Why Three.js over Babylon or PlayCanvas?**
A: Three.js is the lightest and most widely-used. Babylon is heavier and game-engine-shaped (we don't need physics or scripting). PlayCanvas is editor-driven, doesn't fit a code-first workflow.

**Q: How do you place a design correctly on a curved surface like a mug?**
A: The model's UV unwrap (made in Blender) tells us where each 3D point lives in 2D texture space. We compute the printable region's UV bounds, draw the user's image into the matching pixels of a canvas, and bind that canvas as the mesh's texture. The mesh's existing UVs handle the curvature for us.

**Q: What if the user uploads their own model without UVs?**
A: We fall back to procedural UV projection — planar projection for shirt-like meshes, cylindrical for mug-like meshes. It's not pixel-perfect but it works.

**Q: How do you keep 60fps with multiple lights and shadows?**
A: PCFSoft shadow map only on the main directional light, pixel ratio capped at 2, ACES tone mapping done once on the GPU, and one render call per RAF tick. We dispose materials and geometries on model swap to keep GPU memory flat.

**Q: How does the snapshot work?**
A: `WebGLRenderer` is constructed with `preserveDrawingBuffer: true` so the canvas's pixels are readable after `render()`. We temporarily resize the renderer to the export resolution, render once, call `canvas.toBlob('image/png')`, then restore the previous size.

**Q: How big are the bundles?**
A: Three.js itself is ~150KB gzipped. We split it into its own vendor chunk so it caches independently of app code. Total initial JS is under 250KB.

### AI / Imagine

**Q: What AI model do you use and why?**
A: PuLID-Flux on Replicate. PuLID = Pure and Lightning ID, which preserves facial identity better than IP-Adapter approaches. Flux gives strong prompt fidelity. InstantID is our fallback for when PuLID is queued.

**Q: How do you keep the user's face from being warped?**
A: PuLID injects face identity features into the diffusion process at every step, not just as a conditioning image. It's the current SOTA for identity preservation in open-weight models.

**Q: How fast is generation?**
A: 5–15 seconds typical on Replicate's PuLID-Flux endpoint, plus queue wait if the cold-start is hit.

**Q: How do you keep the Replicate API key safe?**
A: Today it's a Vite env var for prototyping. Before mobile ship it moves into a Lambda — the frontend creates an `ImagineJob` row, the Lambda reads the row, calls Replicate, writes the result back. The token never leaves AWS.

**Q: What about NSFW filtering / abuse?**
A: Replicate has built-in NSFW detection on the model output. For a production launch we'd add a moderation layer on the prompt input as well.

**Q: What happens if generation fails?**
A: The `ImagineJob` row's status is updated to `FAILED` with an `errorMessage`. The UI shows the error in the gallery card. The user can retry.

**Q: Why not use OpenAI / Anthropic / Google for image generation?**
A: Their image APIs don't expose identity-preservation models. PuLID-Flux is open-weight and Replicate happens to host it.

### Auth / Security

**Q: How do you store passwords?**
A: We don't — Cognito does. It hashes them with industry-standard algorithms, salts them, and never exposes them. We only handle the JWT after sign-in.

**Q: What's the password policy?**
A: 12 chars minimum, requires upper, lower, numbers, and special chars. Stricter than most consumer apps.

**Q: Where's the JWT stored?**
A: localStorage. The XSS attack surface is small because Vue auto-escapes everything and we don't render user HTML. For a higher-risk product we'd add a refresh-token-in-cookie pattern.

**Q: How do you prevent users seeing each other's data?**
A: AppSync `@auth(rules: [{ allow: owner }])` filters every query at the resolver — DynamoDB only returns rows where `owner == identity.sub`. S3 paths are scoped to `{identity_id}` and IAM enforces that at the bucket level. Two layers, both server-side.

**Q: Is there MFA?**
A: Off today. Cognito supports SMS and TOTP — we'd enable for paid tiers.

**Q: Are images encrypted at rest?**
A: Yes — S3 server-side encryption is on by default for all our buckets (AES-256). In flight everything is TLS.

### Backend / Data

**Q: Why GraphQL over REST?**
A: One request fetches a design plus its assets plus the user profile. Typed contract from schema. Real-time subscriptions for the Imagine gallery come for free.

**Q: Why DynamoDB over RDS / Postgres?**
A: We don't need joins. We need key-value reads at millisecond latency that scale to zero cost when no one's using the app. DynamoDB is the right shape and is what AppSync defaults to.

**Q: What region are you in?**
A: ap-southeast-1 (Singapore). Closest to our target audience.

**Q: How do you handle migrations?**
A: Amplify Gen 2 schema changes generate CloudFormation diffs that apply on `pnpm amplify:deploy`. Destructive changes (renames, type changes) need explicit data backfills.

**Q: What's your backup strategy?**
A: DynamoDB has point-in-time recovery enabled. S3 has versioning on the protected and private prefixes.

### Mobile

**Q: How do you debug on a real iPhone?**
A: Set `CAPACITOR_SERVER_URL` to the Mac's LAN IP, `pnpm dev`, plug phone with Developer Mode enabled, hit Run in Xcode. The app loads from Vite over Wi-Fi with full HMR.

**Q: How do you access the camera?**
A: `@capacitor/camera` bridges to native `AVCaptureDevice` (iOS) / `CameraX` (Android). We call `Camera.getPhoto({ source: Prompt })`, the user picks gallery or camera, we get back a `webPath` we fetch into a `Blob`.

**Q: What permissions do you need on iOS?**
A: `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` in `Info.plist`. Both have user-facing strings explaining why.

**Q: Why a web view instead of native?**
A: Same codebase across web, iOS, Android. The performance ceiling is high enough for our 3D + camera + AI use case — we'd only consider going native if WebGL on a particular device couldn't hit our frame target.

**Q: What's the App Store / Play Store status?**
A: iOS app is in TestFlight; Android is in internal testing track. Public launch planned after Imagine feature is shipped end-to-end.

### Performance

**Q: How big is the app?**
A: Under 250KB gzipped initial JS, plus the Three.js vendor chunk (~150KB) and the AWS vendor chunk loaded on demand. GLB models are 200KB–1.5MB each and load from the public directory or S3.

**Q: How do you keep 60fps with the camera and 3D running?**
A: They don't run simultaneously — camera is modal. When the 3D viewer is active we cap pixel ratio at 2 and use a single RAF loop with damping for smooth interaction.

**Q: What happens on a low-end phone?**
A: Texture cap at 2048 and PCFSoft shadows are tunable. We'd add a quality preset for older devices if testing showed it was needed.

### Testing / Quality

**Q: How do you test?**
A: Vitest for unit tests (Pinia stores, components, composables) with happy-dom. Playwright for E2E flows (login, signup). Type-check and lint gate every commit.

**Q: How do you test the 3D viewer?**
A: Unit tests for the math (UV bounds, planar projection, compositor math). Visual testing of the renderer is manual today; we'd add Playwright + GPU snapshot tests for production.

**Q: What's your CI?**
A: GitHub Actions running type-check, lint, build, and unit tests on every push. Amplify pipeline handles deploys.

### Cost / Scaling

**Q: What does this cost to run?**
A: At low usage: under $20/month total (Cognito is free under 50k MAU, AppSync is per-request, DynamoDB on-demand, S3 by storage + transfer). Replicate is the variable cost — about $0.01–0.05 per Imagine generation depending on the model.

**Q: How does it scale?**
A: Every layer is serverless and scales horizontally without intervention. The bottleneck at extreme scale would be Replicate's queue, which we'd address by pre-warming popular model versions or self-hosting on AWS GPU instances.

**Q: What happens at 100k users?**
A: Cognito and DynamoDB don't care. S3 scales to exabytes. AppSync has soft limits we'd lift via support ticket. Replicate would need volume pricing or self-hosted inference.

### Roadmap / Hard Questions

**Q: What's not working yet?**
A: Imagine Steps 3–5 (real Replicate call, S3 persistence, Lambda proxy). Android shell isn't tested as thoroughly as iOS. Template marketplace is planned but not built.

**Q: What's the biggest technical risk?**
A: Replicate cost at scale and quality consistency. PuLID-Flux is excellent today but model availability and pricing on Replicate can change. We've architected the Lambda boundary so swapping providers is a one-file change.

**Q: What's the biggest product risk?**
A: AI generation quality variance. If 1 in 5 generations is unflattering, users churn. Mitigation: let users regenerate, give simple prompt presets, hide unflattering outputs behind a "try again" CTA.

**Q: How would you add AR?**
A: ARKit (iOS) and ARCore (Android) via a Capacitor plugin. The 3D model pipeline already produces GLBs ARKit understands; we'd add a `useARViewer` composable that hands the active model to the AR session. The Imagine face capture pipeline gives us a starting point for face-tracking AR features later.

**Q: What would you do differently if you started over?**
A: Probably skip the editor view's deep coupling to Pinia early on — composables alone would have been enough. Otherwise the stack has held up.

---

## Part 12 — Cheat Sheet (Memorize These)

- **Frontend:** Vue 3, TypeScript strict, Vite, Pinia, Tailwind CSS
- **3D:** Three.js + GLTFLoader + OrbitControls + CanvasTexture
- **Mobile:** Capacitor 5, @capacitor/camera, native iOS/Android shells
- **Auth:** AWS Cognito User Pool, JWT in localStorage
- **API:** AWS AppSync (GraphQL), code-first schema, `@auth(owner)`
- **DB:** DynamoDB, on-demand, one table per model
- **Storage:** S3, three access tiers (public/protected/private)
- **AI:** Replicate, PuLID-Flux (InstantID fallback), Lambda proxy planned
- **Build:** pnpm, Vite (manual chunks: vue/three/aws), ESLint, Vitest, Playwright
- **Region:** ap-southeast-1
- **Cost:** ~$20/month + Replicate variable cost

If someone asks something you don't know: "I'd need to check the code to give you an exact answer — what I can say at the architecture level is..." then steer back to the part you do know.
