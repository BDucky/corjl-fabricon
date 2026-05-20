# Corjl try-it-on — Tài liệu học kỹ thuật & Lý do chọn công nghệ

Tài liệu này dành cho hai mục đích:

1. **Học công nghệ** — Giải thích rõ từng công nghệ đang dùng trong dự án (Vue 3, Three.js, Capacitor, AWS serverless, Replicate, ...) là gì và hoạt động ra sao.
2. **Giải thích lý do chọn** — Mỗi lần chọn một công nghệ, tại sao chọn nó mà không chọn lựa chọn thay thế (vd: Vue 3 thay vì React, Capacitor thay vì React Native, Three.js thay vì Babylon, IDM-VTON thay vì PuLID-Flux cho áo, ...).

Đọc xong tài liệu này, bạn sẽ trả lời được hầu hết câu hỏi mà bất kỳ ai đặt ra trong một buổi demo / phỏng vấn về dự án.

---

## Phần 1 — Tóm tắt kiến trúc trong một đoạn

Corjl try-it-on (tên hiển thị trên iOS: **Try-It-On**; bundle ID `com.corjl.fabricon` giữ nguyên vì lý do tương thích App Store) là một **Single Page Application Vue 3** sử dụng **Three.js** để hiển thị 3D mockup sản phẩm trực tiếp, và dùng **Capacitor** để đóng gói chính source code web thành app iOS/Android native. Backend chạy hoàn toàn trên **AWS serverless**: **Cognito** xử lý xác thực, **AppSync** cung cấp GraphQL API được hỗ trợ bởi **DynamoDB**, **S3** lưu file thiết kế và ảnh AI sinh ra. Tính năng đặc trưng — **"Try-It-On"** (trước đây gọi là Imagine) — lấy ảnh mockup 3D + ảnh khuôn mặt người dùng và gọi **Replicate** để sinh ảnh AI cá nhân hoá: dùng **IDM-VTON** cho áo (giữ lại cả thiết kế in lên áo lẫn khuôn mặt) và **PuLID-Flux** cho các vật khác (chỉ giữ khuôn mặt; tuyến này đang ẩn khỏi UI). Prompt được **sinh tự động theo sản phẩm** — người dùng không phải gõ. Hiện tại lệnh gọi Replicate đi thẳng từ client qua `CapacitorHttp` (đang prototype); trước khi launch công khai sẽ chuyển vào **Lambda** để token API không bao giờ ra khỏi AWS, đồng thời thay thế các model có license non-commercial (IDM-VTON CC BY-NC-SA, Flux.1-dev).

Nếu bạn đọc thuộc lòng đoạn trên, bạn đã có 80% câu trả lời cho bất kỳ câu hỏi cấp kiến trúc nào.

---

## Phần 2 — Lớp Frontend: Vue 3 + TypeScript + Vite + Pinia

### Vue 3 với Composition API

**Là gì.** Vue là framework UI reactive. Vue 3 là phiên bản viết lại từ đầu trên TypeScript, đi kèm "Composition API" — cho phép viết logic theo dạng hàm thuần (`useThreeScene()`, `useTextureMapper()`, ...) thay vì gói trong `data/methods/computed` như Vue 2.

**Mọi component đều là Single File Component** (`.vue`) dùng `<script setup lang="ts">`:
- **Composition API** — logic là TypeScript thuần, không bị ràng buộc bởi options của component. Có thể tách `useThreeScene()` ra để unit-test độc lập.
- **`<script setup>`** — các lệnh `ref`, `computed`, `watch` ở top-level tự động trở thành reactive, không cần boilerplate `export default { setup() { ... } }`.
- **Reactivity của Vue** dùng Proxy — gán giá trị vào `.value` của ref thì component re-render. Chúng ta dùng "tiết kiệm" vì Three.js là imperative; giữ phần reactive surface nhỏ gọn quanh phần Three.js (lớn, imperative).

**Tại sao chọn Vue 3 thay vì React?**
- **Bundle nhỏ hơn** — Vue runtime ~34KB gzipped vs React ~45KB; với một app phải nhúng cả Three.js (150KB) thì mỗi KB đều quý.
- **SFC ergonomics đơn giản hơn** — `<template>` + `<script setup>` + `<style scoped>` trong một file. Không cần JSX, không cần CSS-in-JS.
- **`<script setup>` giữ lớp Three.js (imperative) tách bạch khỏi UI reactive** — quan trọng khi component nhúng một WebGL scene khổng lồ. Trong React phải dùng `useEffect` + `useRef` rất nhiều và dễ dính bug "stale closure".
- **Vue Reactivity dựa Proxy không có dependency array** — không có cái footgun `useEffect(() => {}, [...])` trong React.
- **Team quen Vue** — yếu tố thực dụng.

### TypeScript strict mode

**Là gì.** TypeScript thêm static type checking vào JavaScript. "Strict mode" bật toàn bộ kiểm tra nghiêm ngặt (`strict: true` trong `tsconfig.json`).

**Hệ quả khi bật strict:**
- `null`/`undefined` không được phép ngầm — mỗi biến nullable phải khai báo `Type | null`.
- Tham số hàm bắt buộc phải có kiểu.
- `noImplicitAny` được bật — không được implicit `any`.

**Tại sao chọn strict mode?**
- Phải trả "thuế type" một lần ở giai đoạn viết code, nhưng từ đó **không bao giờ phải debug "cannot read property of undefined"** ở production nữa.
- Phần 3D đụng đến scene graph của Three.js cần type-safe truy cập (`THREE.Mesh`, `THREE.MeshStandardMaterial`, `OrbitControls`) — `@types/three` cho điều này gần như miễn phí.
- GraphQL trả về dữ liệu có cấu trúc — type chuẩn từ schema giảm nguy cơ field lệch tên.

### Vite

**Là gì.** Bundler thế hệ mới của tác giả Vue. Hai chế độ:
- **Dev server** — sử dụng native ES modules; không bundle trong dev, HMR (Hot Module Replacement) gần như tức thì.
- **Build** — dùng Rollup ở dưới với cấu hình `manualChunks` tách bundle.

**Cấu hình `manualChunks` của chúng ta:**
- `vendor-vue` — vue + vue-router + pinia (~70KB gzipped)
- `vendor-three` — three (~150KB gzipped — chunk nặng nhất)
- `vendor-aws` — aws-amplify + auth
- Lý do tách: khi sửa code UI không làm invalid cache Three.js trong browser. Người dùng quay lại lần thứ hai không phải tải lại 150KB three.js.

**Path alias** (`@/`, `@modules/`, `@services/`, `@stores/`) được khai báo cả trong `vite.config.ts` lẫn `tsconfig.json` để vừa runtime resolve được vừa TypeScript hiểu được.

**Tại sao chọn Vite thay vì Webpack?**
- **HMR sub-100ms** vs Webpack thường 1-5s — quan trọng khi đang code Three.js scene và muốn xem kết quả ngay.
- **Cấu hình ít hơn nhiều** — Webpack cần config phức tạp; Vite gần như "zero config" cho mọi thứ thông thường.
- **Vite kế thừa hệ sinh thái Rollup cho production build** — tốt nhất trong các bundler hiện nay.

### Pinia (state management)

**Là gì.** Thư viện state management chính thức cho Vue 3, thay thế Vuex.

| Store | Đường dẫn | Lưu gì |
|---|---|---|
| `auth` | `src/stores/auth.ts` | user, JWT, isAuthenticated, signIn/signOut actions |
| `designs` | `src/stores/designs.ts` | danh sách designs từ AppSync, loading state |
| `viewer3d` | `src/modules/viewer3d/store.ts` | model active, design URL, lighting/camera presets, export settings |

**Pattern**: store là hàm composable thuần (`useAuthStore()`). State là `ref`/`reactive`; action là method thường. Không có "mutation/action ceremony" như Vuex.

**Tại sao Pinia thay vì Vuex hay state lib khác?**
- **TypeScript inference tự nhiên** — không cần generic boilerplate.
- **Composition API style** — store đọc giống một custom hook, dễ tổ hợp với composable khác.
- **Tác giả Vue.js và team Vue.js official endorse** — đảm bảo về lâu dài.

### Tailwind CSS

**Là gì.** Utility-first CSS framework. Thay vì viết `.btn { ... }`, ta viết trực tiếp `class="flex items-center gap-3 rounded-lg bg-surface-1"`.

**Setup của chúng ta:**
- Theme qua CSS custom properties (`var(--text-primary)`, `var(--border-subtle)`) — dark theme có thể swap mà không phải rewrite markup.
- Safe-area utilities (`pt-safe`, `pb-safe-b`) cho thiết bị có notch.

**Tại sao Tailwind thay vì CSS-in-JS hay CSS Modules?**
- **Không cần đặt tên class** — nhiều thời gian nhất khi viết CSS thường là nghĩ tên class. Tailwind loại bỏ điều đó.
- **CSS bundle final rất nhỏ** (Tailwind PurgeCSS chỉ giữ class thực sự dùng) — thường ~10-20KB gzipped cho cả app.
- **Style nằm cạnh markup** — không phải nhảy giữa file `.vue` và `.css`.

---

## Phần 3 — 3D Engine: Three.js

### Three.js là gì

Three.js là **low-level WebGL wrapper**. Nó không tự ý quyết định gì cho bạn — bạn tự xây scene graph, camera, renderer, lighting, controls, animation loop. Đó là lý do chúng ta có nhiều composable: mỗi cái đóng gói một lát Three.js thành một hook tái sử dụng được.

### Scene graph (`useThreeScene.ts`)
```
Scene
├── PerspectiveCamera (FOV 45°, vị trí [2.1, 1.5, 2.1], nhìn về gốc toạ độ)
├── WebGLRenderer (trong <canvas> bên trong container div)
│   ├── antialias: true
│   ├── preserveDrawingBuffer: true   ← thiết yếu để export snapshot
│   ├── alpha: true                    ← cho phép nền trong suốt
│   ├── pixelRatio: min(devicePixelRatio, 2)   ← chặn ở 2x trên retina (perf)
│   ├── toneMapping: ACESFilmicToneMapping
│   ├── outputColorSpace: SRGBColorSpace
│   └── shadowMap: PCFSoftShadowMap
├── OrbitControls (chuột/touch xoay quanh model)
│   ├── enableDamping: true (giảm tốc mượt)
│   ├── dampingFactor: 0.08
│   ├── minDistance: 0.5, maxDistance: 20
└── Animation loop: requestAnimationFrame → controls.update() → renderer.render(scene, camera)
```

Cộng thêm `ResizeObserver` trên container — mỗi lần container resize thì cập nhật aspect camera và size renderer.

### Vì sao `preserveDrawingBuffer: true`?

Mặc định, WebGL clear canvas sau mỗi frame để giải phóng GPU memory. Nếu gọi `canvas.toBlob()` sau khi đã render, kết quả là PNG trắng tinh. Bật `preserveDrawingBuffer: true` giữ pixel của frame cuối lại để đọc được. Đây là điều khiến tính năng export PNG và snapshot Imagine hoạt động.

### Pipeline texture mapping (phần khó giải thích nhất)

Một ảnh phẳng của người dùng → texture được đặt đúng vị trí trên áo cong 3D thông qua chuỗi sau:

1. **UV unwrap của model** — mỗi đỉnh GLB có thuộc tính `uv` (toạ độ 2D trong [0,1] nói "tôi nằm ở đâu trên ảnh 2D?"). Modeler tạo unwrap này trong Blender; ta đọc lại.
2. **`computeUVBounds`** — duyệt buffer `uv` của target mesh, tìm min/max U và V → đó là vùng "printable" trong không gian texture.
3. **`generatePlanarUVs` / `generateCylindricalUVs`** — fallback nếu GLB không có UV usable (một số model upload thiếu). Planar = chiếu phẳng theo một trục (tốt cho mặt trước áo). Cylindrical = quấn quanh trục (tốt cho mug).
4. **`textureCompositor`** — tạo `<canvas>` ở độ phân giải cố định (vd 2048×2048). Vẽ ảnh user vào với offset/scale khớp UV bounds.
5. **`THREE.CanvasTexture`** bao bọc canvas đó. Pixel của texture = pixel của canvas.
6. **`useTextureMapper`** tìm các target mesh (qua `activeModel.targetMeshNames`), lưu lại `MeshStandardMaterial.color` gốc (để khôi phục khi clear), gán texture của canvas vào `.map` của material.
7. Khi user kéo để reposition, ta **vẽ lại canvas compositor** với offset mới và set `texture.needsUpdate = true`. Three.js re-upload canvas lên GPU ở frame tiếp theo.

**Vì sao đặt canvas ở giữa?** Vẽ lại canvas rẻ. Re-upload ảnh gốc (có thể 4K) lên GPU mỗi lần kéo sẽ chậm.

### 9 models trong `public/models/`
- `tshirt.glb`, `polo.glb`, `tanktop.glb`, `hoodie.glb` — đồ may mặc, UV planar mặt trước
- `toteBag.glb` — UV planar mặt panel trước
- `coffeeMug.glb` — UV cylindrical quanh thân
- `phoneCase.glb` — planar trên mặt sau
- `cardboardBox.glb` — UV nhiều panel
- `standee.glb` — flat cutout

Tất cả load qua `GLTFLoader` (`three/examples/jsm/loaders/GLTFLoader.js`).

### Lighting (`useLighting.ts`)
Three.js không có "Studio mode" sẵn — chúng ta tự dựng. Mỗi preset là tổ hợp của:
- `AmbientLight` (đều, không có shadow)
- `DirectionalLight` (giống mặt trời, đổ shadow)
- 1-2 `DirectionalLight` làm rim/back light

Kết hợp `ACESFilmicToneMapping` của renderer và shader PBR của `MeshStandardMaterial` → cảm giác metallic/roughness.

### Memory hygiene (`utils/dispose.ts`)
Three.js **không** tự garbage-collect GPU resource. Khi unload model phải duyệt scene graph và gọi `.dispose()` trên mọi geometry, material, texture. Bỏ qua điều này → leak GPU memory và crash trên mobile sau vài lần switch model.

### Tại sao chọn Three.js?

- **Nhẹ nhất trong các 3D engine lớn cho web** — Babylon.js nặng hơn 2-3 lần và hướng game engine (có physics, scripting — thứ ta không cần).
- **Cộng đồng lớn nhất** — `GLTFLoader`, `OrbitControls`, post-processing... đều có sẵn và stable.
- **PlayCanvas hướng editor-driven** — không hợp với workflow code-first của chúng ta.
- **Cần WebGL trực tiếp ở mức thấp** — Three.js không "hide" WebGL khỏi bạn; muốn tinh chỉnh shadow/tone mapping/colour space đều làm được, không bị framework chặn.

---

## Phần 4 — Mobile: Capacitor 5

### Capacitor là gì

Capacitor là **native runtime** đóng gói `WKWebView` (iOS) hoặc `WebView` (Android) và mở JS bridge sang native API. App Vue chạy nguyên xi bên trong web view đó; khi gọi `Camera.getPhoto()`, JS bridge marshal lệnh sang code Swift/Kotlin native, mở camera hệ thống thật, rồi gửi ảnh trả lại.

### Config của chúng ta (`capacitor.config.ts`)
- `appId: com.corjl.fabricon` — reverse-DNS bundle ID; cũng là iOS bundle và Android package (giữ nguyên ID cũ để TestFlight install hiện có không bị reset).
- `appName: Try-It-On` — tên hiển thị trên home screen.
- `webDir: dist` — output build của Vite; cái được nhúng vào native shell để upload App Store / Play Store.
- `server.url` — khi `CAPACITOR_SERVER_URL` env var được set, app **load từ Vite dev server qua LAN** thay vì bundled `dist/`. Cho phép hot-reload trên iPhone khi đang code. Không set khi build release.
- `cleartext: true` (chỉ khi set dev URL) — cho phép HTTP cho dev server local.
- `androidScheme: 'https'` — Android webview dùng `https://` kể cả với nội dung local.

### Plugin đang dùng
| Plugin | Dùng để |
|---|---|
| `@capacitor/camera` | Chụp ảnh ở design upload + Try-It-On face capture |
| `@capacitor/filesystem` | Lưu download local |
| `@capacitor/status-bar` | Theme dark, overlay edge-to-edge |
| `@capacitor/keyboard` | `resizeOnFullScreen: true` để input không bị che |
| `@capacitor/splash-screen` | Splash 3 giây khi cold start |
| `@capacitor/app` | Hook lifecycle (background/foreground) |
| `@capacitor/core` (`CapacitorHttp`) | HTTP request bypass CORS của WebView — dùng cho lệnh gọi Replicate |

### Vòng lặp dev trên iPhone thật
1. Set `CAPACITOR_SERVER_URL=http://<mac-lan-ip>:5173` trong `.env`
2. `pnpm dev` (Vite trên Mac, listen `0.0.0.0`)
3. `pnpm capacitor:sync` — copy config sang iOS project
4. `pnpm capacitor:open:ios` — mở Xcode
5. Cắm điện thoại, trust, bật Developer Mode, bấm Run
6. App mở, load từ Mac — mỗi save Vue trigger HMR trên điện thoại

Cho TestFlight: unset `CAPACITOR_SERVER_URL`, `pnpm build`, `pnpm capacitor:sync`, Archive trong Xcode.

### Tại sao chọn Capacitor thay vì React Native?

- **Cùng một codebase Vue cho web + iOS + Android** — RN render sang native widget qua bridge khác, đòi hỏi UI native song song. Với team nhỏ là một multiplier khổng lồ.
- **Workflow web tự nhiên** — debug bằng Safari Web Inspector hay Chrome DevTools quen thuộc, không phải học Flipper hay Reactotron.
- **WebGL chạy tốt trong WKWebView** — Three.js đạt 60fps trên iPhone đời mới. Đây là use case quyết định: nếu cần native rendering (vd game AAA) thì RN/native là đúng, nhưng cho 3D mockup product thì WebGL là đủ.
- **Capacitor 5 hơn hẳn Cordova/Ionic Classic** — TypeScript support tốt hơn, drop-in cho mọi framework web, do team Ionic làm và maintain.

### Tại sao không native rewrite hoàn toàn?

Sẽ phải duy trì 3 codebase (web Vue + iOS Swift/SwiftUI + Android Kotlin/Compose). Với một team nhỏ thì gần như không khả thi. Trade-off chấp nhận: hiệu năng có "trần" thấp hơn native, nhưng đủ cho use case 3D + camera + AI của chúng ta.

---

## Phần 5 — Authentication: AWS Cognito

### Cognito là gì
Một managed user-pool service. Lưu user record, hash password (chuẩn Argon2), xử lý email verification code, password reset, refresh token, và phát JWT có thể verify offline. Tương đương Auth0 hay Firebase Auth trong hệ sinh thái AWS.

### Setup (`amplify/auth/resource.ts`)
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
- Đăng nhập bằng email (không có username)
- Sàn 12 ký tự + quy tắc phức tạp
- Verify code qua email khi signup
- MFA tắt hôm nay (sẽ bật cho production)

### Frontend (`src/stores/auth.ts`)
- Bọc `signIn`, `signUp`, `confirmSignUp`, `signOut`, `resetPassword` của `aws-amplify/auth`
- Lưu JWT trong `localStorage` (key: `corjl_auth_token`)
- Khi app boot, `main.ts` gọi `authStore.initialize()` kiểm tra token còn hạn và refresh nếu cần
- Computed `isAuthenticated` là single source of truth cho router beforeEach guard

### Tại sao JWT trong localStorage thay vì httpOnly cookie?
Hai lý do:
1. AppSync nhận JWT trong header `Authorization` — dễ với localStorage hơn cookie + CSRF token
2. WebView của Capacitor không có khái niệm httpOnly cookie đúng nghĩa

Nguy cơ XSS được giảm thiểu bởi việc Vue auto-escape HTML; ta không render HTML do user nhập mà không sanitize.

### Tại sao chọn Cognito?

- **Managed hoàn toàn** — không phải tự build user pool, không phải lo password hashing đúng cách, không phải tự xử lý email delivery.
- **Tích hợp gốc với hệ AWS** — AppSync nhận token Cognito trực tiếp; S3 dùng Identity Pool ID làm key cho IAM. Đụng đúng "stack effect" của AWS.
- **Free tier rộng** — 50,000 MAU miễn phí. Phù hợp giai đoạn product chưa lớn.
- **So sánh Auth0/Firebase**: chất lượng tương đương, nhưng tổng cost AWS rẻ hơn ở scale của ta và một-stack đỡ phải maintain nhiều provider.

---

## Phần 6 — Data API: AppSync + GraphQL + DynamoDB

### AppSync là gì
Managed GraphQL service. Bạn định nghĩa schema; AWS spin lên các resolver map operation GraphQL sang data source (DynamoDB, Lambda, HTTP, ...). Với chúng ta, mọi resolver hit DynamoDB.

### Schema (`amplify/data/schema.ts`)
Năm model, tất cả owner-scoped bằng `@auth(rules: [{ allow: owner }])`:

| Model | Mục đích | Field chính |
|---|---|---|
| `UserProfile` | Hàng user | subscriptionTier, preferences (JSON) |
| `DesignTemplate` | Template sản phẩm tái sử dụng | modelUrl, modelThumbnailUrl, uvMappingData, isPublic |
| `DesignProject` | Project của user | name, templateId, canvasData, status |
| `ProjectAsset` | File upload | type, fileSize, mimeType |
| `ProjectExport` | Lịch sử export | type, fileUrl |
| `ImagineJob` (planned) | AI try-on jobs | designId, mockupKey, faceKey, status, resultKey |

### Tại sao GraphQL thay vì REST?

- **Một round-trip cho mỗi screen** — lấy một design + asset + user profile trong một request. REST cần nhiều endpoint hoặc một endpoint "kitchen sink".
- **Type-safe contract** — codegen sinh type TypeScript từ schema.
- **Subscription miễn phí** — khi `ImagineJob` đổi status, Imagine gallery cập nhật mà không cần polling.
- **Field-level @auth** — phân quyền chi tiết tới từng field, khó làm sạch sẽ ở REST.

### Authorization
`@auth(rules: [{ allow: owner }])` báo AppSync inject filter vào resolver: chỉ trả về row có `owner == $context.identity.sub` (Cognito user ID). User không thể xem dữ liệu nhau kể cả khi craft query độc.

### DynamoDB
- NoSQL key-value store, đọc đơn vị mili-giây ở mọi scale
- Giá per-request (on-demand) — không phải plan capacity
- Một table per model (Amplify tạo)
- Index trên `owner` cho query "list mine"

### Tại sao DynamoDB thay vì RDS / Postgres?

- **Không cần JOIN** — workload của ta là key-value read latency thấp + scale to zero cost khi không có user.
- **Đúng "shape" của AppSync** — AppSync default DynamoDB; gắn vào RDS phải qua Lambda → tăng latency và complexity.
- **Backup tự động qua point-in-time recovery** — không phải tự setup pg_dump cron.
- **Trade-off chấp nhận**: query phức tạp (analytics, JOIN nhiều bảng) phải gửi sang một tool khác (vd Athena query S3 export). Hợp với workflow của ta.

### Tại sao Amplify Gen 2 thay vì Gen 1?
- **Code-first TypeScript** (`defineAuth`, `defineData`, `defineStorage`) thay cho interactive CLI lằng nhằng
- **Per-environment sandbox** — mỗi dev có sandbox AWS riêng, không đụng nhau
- **Không drift `amplify-cli` global** — install per-repo, không cần global CLI nào

---

## Phần 7 — Storage: S3

### Ba tầng truy cập, một bucket (`amplify/storage/resource.ts`)
| Prefix | Read | Write | Use |
|---|---|---|---|
| `public/*` | Bất kỳ ai (guest + auth) | Curated | Template, demo asset |
| `protected/{identity_id}/*` | Owner + user khác auth | Owner only | Design preview (sharable) |
| `private/{identity_id}/*` | Owner only | Owner only | Upload gốc, AI input |

`{identity_id}` là Cognito Identity Pool ID của user đang sign in. Amplify sinh IAM policy bind path access vào identity tại tầng bucket — kể cả nếu app có bug, S3 vẫn từ chối read cross-user.

### Upload (`src/services/s3.ts`)
```ts
new S3Client({ region: 'ap-southeast-1' })
new PutObjectCommand({ Bucket, Key, Body, ContentType })
```
- `uploadToS3(key, file)` — upload generic
- `uploadCanvasAsImage(canvas, key)` — `canvas.toBlob('image/png')` → upload
- `getSignedUrl(key, expiresIn)` — URL ký trước cho GET private

### Tại sao gọi SDK trực tiếp thay vì Amplify Storage helper?
Amplify `Storage.put()` work nhưng couple chặt vào identity-pool wiring của Amplify. Dùng bare SDK explicit hơn và dễ migrate hơn nếu sau này move khỏi Amplify.

---

## Phần 8 — AI Pipeline: Imagine / Try-It-On

### Bài toán

User có 2 input:
- **Mockup 3D** (sản phẩm của họ với design của họ render trong viewer Three.js)
- **Ảnh khuôn mặt** (chính họ, chụp qua camera điện thoại)

Mong muốn: **một ảnh duy nhất** trong đó:
1. **Identity khuôn mặt** = khuôn mặt thật của khách, không phải look-alike
2. **Hình học sản phẩm** = sản phẩm họ chọn, framing tự nhiên
3. **Pixel của design** = artwork thật của họ, không phải approximation

Không có input prompt thứ ba từ user — chứng minh là UX kém (user không kỹ thuật để trống hoặc viết text mâu thuẫn). Prompt được **sinh tự động theo sản phẩm** từ `src/services/imagine/promptBuilder.ts`.

### Tại sao bài toán này khó?

Stable Diffusion vanilla có thể "người mặc hoodie ở Tokyo" — nhưng người, hoodie, và hình in trên hoodie đều **random**. Cần ba thứ được preserve:
1. Khuôn mặt khách thực tế
2. Sản phẩm cụ thể mà họ chọn
3. Pixel design cụ thể họ thiết kế

Không một model open-weight nào xử lý cả ba trên cả áo lẫn vật thể vật lý. Đó là lý do ta xây **per-product router**.

### Router (`src/services/imagine/promptBuilder.ts`)
```ts
export const MODEL_KIND: Record<string, ModelKind> = {
  tshirt: 'garment', polo: 'garment', hoodie: 'garment', tanktop: 'garment',
  totebag: 'face', phonecase: 'face', coffeemug: 'face',
  cardboardbox: 'face', standee: 'face',
}
```

- **Tuyến `garment`** → `cuuupid/idm-vton` (IDM-VTON). Virtual try-on thật. Giữ design + giữ khuôn mặt. Tuyến duy nhất surface trên UI hôm nay.
- **Tuyến `face`** → `bytedance/flux-pulid` (PuLID-Flux). Chỉ giữ face; pixel design KHÔNG được preserve (model không thấy mockup). Đã wire trong code nhưng ẩn khỏi UI (xem "Phạm vi hôm nay").

Router gọi một lần khi submit trong `replicateClient.ts`:
```ts
if (modelKind(modelId) === 'garment' && modelId) {
  return generateGarment(token, modelId, mockupUri, faceUri)
}
return generateFace(token, modelId, faceUri)
```

### IDM-VTON là gì và tại sao chọn cho áo?

**IDM-VTON** (Improved Diffusion Models for Virtual Try-On) là **model virtual try-on** chính hiệu — đầu vào là ảnh garment + ảnh người, đầu ra là ảnh người mặc garment đó, **giữ nguyên cả khuôn mặt lẫn họa tiết in trên garment**.

**Input của ta cho IDM-VTON:**
```ts
{
  garm_img: <data URI của mockup đã cleanBg + auto-frame>,
  human_img: <data URI của ảnh user thật>,
  garment_des: buildGarmentDescription(modelId),  // text hint theo sản phẩm
  category: 'upper_body',
  crop: false,
  seed: Math.floor(Math.random() * 1_000_000),
  steps: 30,
}
```

**Tại sao chọn IDM-VTON?**
- **Là model Replicate duy nhất tôi tìm thấy nhận CẢ ảnh garment + ảnh người** và preserve cả hai. PuLID chỉ face-only. SDXL với IP-Adapter không preserve design pixel.
- **Interface "person image + garment image + text hint" trùng đúng shape input của Try-It-On.**
- **Limitation**: re-paint garment nên chi tiết nhỏ (logo, text) bị smudge. Step 3.6 auto-frame là cải thiện đầu tiên.
- ⚠️ **License CC BY-NC-SA 4.0** — chỉ non-commercial. Phải thay trước khi commercial launch.

### PuLID-Flux là gì và tại sao chọn cho face route?

**PuLID** (Pure and Lightning ID) inject feature identity khuôn mặt vào quá trình diffusion ở **mỗi denoising step**, không chỉ là conditioning image lúc đầu. **Flux** là một base model mới (kiến trúc DiT) cực mạnh về following prompt.

**PuLID + Flux** = giữ "khuôn mặt này" + scene/style theo prompt tốt hơn IP-Adapter hay vanilla SDXL ở chi phí tương đương.

**Input của ta cho PuLID-Flux:**
```ts
{
  prompt: buildPrompt(modelId),
  negative_prompt: buildNegativePrompt(),
  main_face_image: <data URI của face>,
  num_outputs: 1,
  num_steps: 28,        // mild bump so với default 20
  id_weight: 1,         // max face identity strength
  guidance_scale: 6,    // follow prompt mạnh hơn (default 4) — cần model
                        // thực sự vẽ sản phẩm, không vẽ portrait generic
  output_format: 'png', // 'JPG' làm PIL handler bên model chết
}
```

**Tại sao chọn PuLID-Flux cho object route (mặc dù chưa surface)?**
- Object products (mug, tote, phone case) **không có** try-on model preserve design.
- PuLID ít nhất preserve khuôn mặt và frame sản phẩm tự nhiên — "không tốt nhất, nhưng tốt nhất khả dĩ".
- ⚠️ **Flux.1-dev cũng non-commercial.** Cùng blocker với IDM-VTON.

### Pipeline chụp mockup (`useExporter.captureBlob`)

Snapshot mockup là **biến đổi** của capture, không phải viewer user thấy:

1. **`cleanBackground: true`** — ẩn `__grid__` / `__scene_staging__` / `__ground_shadow__`, đổi `scene.background` sang trắng, set `renderer.setClearColor(0xffffff, 1)`. Restore sau khi `toBlob()` resolve.
   *Tại sao:* IDM-VTON không extract được garment từ capture nền dark — output là áo plain skin-tone.
2. **`framePrintArea: true`** (chỉ garment route) — gọi `framePrintArea.ts` tính AABB world-space của vùng in và reposition camera dọc +Z sao cho fill ~80% frame.
   *Tại sao:* IDM-VTON re-paint garment; càng nhiều pixel design feed vào model, fidelity output càng tốt. Step 3.6 #1 của plan.

Cả hai flag được pass bởi `ImagineCreateModal.vue`'s `captureMockup()`:
```ts
const blob = await viewerRef.value.captureBlob({
  width: 1024, height: 1024,
  transparent: false,
  cleanBackground: true,
  framePrintArea: isGarmentRoute.value,
})
```

### Thuật toán auto-frame (`framePrintArea.ts`)

Lý do garment cần điều này: một scene 3D pose tay gửi cho IDM-VTON một patch chest nhỏ trong một mockup full-body. Auto-frame biến thành capture print-area dày pixel.

1. Duyệt model đã load. Mỗi `THREE.Mesh` có tên match `activeModel.targetMeshNames` HOẶC material name match `targetMaterialNames`, gom vào list.
2. Cho mỗi target mesh, iterate `uv` BufferAttribute. Mỗi đỉnh `i` có UV nằm trong `MODEL_TEXTURE_DEFAULTS[id].printAreaUV`:
   ```ts
   tmp.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
   box.expandByPoint(tmp)
   ```
3. Lấy `box.getCenter()` + `box.getSize()`.
4. Dùng `camera.fov` và `aspect` của export:
   ```ts
   const halfV = (camera.fov * Math.PI / 180) / 2
   const halfH = Math.atan(Math.tan(halfV) * aspect)
   const distV = size.y / 2 / Math.tan(halfV) / fillRatio
   const distH = size.x / 2 / Math.tan(halfH) / fillRatio
   const distance = Math.max(distV, distH) + size.z / 2 + 0.1
   ```
5. `camera.position.set(center.x, center.y, center.z + distance)`; `controls.target.copy(center)`; `controls.update()`; `camera.updateProjectionMatrix()`.
6. Return `FrameRestoreState { position, target, aspect }`; `captureBlob` restore sau khi `toBlob()` resolve.

Return `null` (caller fallback về framing của user) khi không có đỉnh nào qualify — defensive cho model user upload không chuẩn.

### Auto-prompt (`promptBuilder.ts`)

Ba primitive lái mọi prompt:
```ts
const FACE_IDENTITY = 'the exact same face, hair, and expression as the reference photo'
const STYLE = 'photorealistic, sharp focus, natural lighting, simple neutral background'
const DESIGN_VISIBLE = 'with a bold colorful printed graphic design clearly visible facing the camera, covering most of the product surface'
```

Mỗi sản phẩm có template một dòng compose chúng:
```ts
tshirt: `Portrait of the same person wearing a cotton t-shirt ${DESIGN_VISIBLE} on the chest. ${FACE_IDENTITY}. ${STYLE}.`,
coffeemug: `Photo of the same person holding a ceramic coffee mug by the handle, the side of the mug turned toward the camera, the mug ${DESIGN_VISIBLE.replace('covering most of the product surface', 'wrapping around the mug side')}. ${FACE_IDENTITY}. ${STYLE}.`,
// ...
```

Negative prompt chặn các failure mode đã gặp trong test sớm:
```ts
'blank product, plain unprinted surface, no design, distorted face, deformed face, multiple faces, multiple people, extra fingers, extra limbs, text watermark, logo overlay, low quality, blurry, cartoon, illustration, painting, sketch'
```

Cho IDM-VTON, `buildGarmentDescription(modelId)` sinh text hint ngắn pass làm `garment_des`:
```ts
tshirt: 'A short-sleeve cotton t-shirt with a printed graphic on the front, fits naturally on the upper body.'
```

### Tại sao bỏ free-text prompt?

Ban đầu có textarea. **Đã bỏ.** Lý do: user không kỹ thuật hoặc để trống hoặc viết text mâu thuẫn. Thay bằng auto-generate emphasize ba thứ ta **thực sự control được**: FACE preservation, PRODUCT framing, "DESIGN EXISTS" (bias model vẽ ra graphic thay vì surface trống). Cộng `negative_prompt` chặn failure mode.

### Tại sao single-stage IDM-VTON thay vì two-stage?

Đã thử 2-stage (PuLID-Flux body-synth → IDM-VTON) để bỏ ràng buộc chest-visibility. **Identity khuôn mặt drop rõ rệt** ở mỗi lần re-paint. User explicitly chọn look real-face kể cả với trade-off chest-visibility. UI mitigate bằng silhouette guide + amber post-capture warning.

### Tại sao chỉ áo (garment-only scope)?

Ngày 2026-05-19, test end-to-end tote bag trả về Replicate **402** từ PuLID-Flux: *"must be less than or equal to 20"* — guard image-count / cost của object route. Thay vì đốt thời gian iterate tuyến không preserve design pixel, picker được filter `modelKind(id) === 'garment'`. Branch UI non-garment và face route trong `replicateClient.ts` được giữ làm dead code để object pipeline có thể revive mà không phải re-port.

### Tại sao `CapacitorHttp` thay vì `fetch`?

API Replicate không nằm trong CORS whitelist của WebView; từ trong WebView iOS, `fetch('https://api.replicate.com/...')` bị block. `CapacitorHttp.post(...)` / `.get(...)` của `@capacitor/core` chạy request qua Swift native, bypass tầng CORS hoàn toàn. Cùng code work cả browser dev (browser local không có CORS blocker) lẫn device.

### Model resolution — `/v1/predictions`, không phải `/v1/models/{slug}/predictions`

Endpoint slug bị giới hạn cho official models của Replicate. Cho community model (`cuuupid/idm-vton`, `bytedance/flux-pulid`) sẽ 404. Workaround:
1. `GET /v1/models/{slug}` một lần per session, đọc `latest_version.id`, cache trong `versionCache` map module-level.
2. `POST /v1/predictions` với `{ version, input }`.

Caching version → chỉ cuộc gọi *đầu tiên* per session chịu round-trip resolution.

### Polling

`pollToCompletion()` chạy `GET /v1/predictions/{id}` mỗi `POLL_INTERVAL_MS` (2s) cho đến khi `status` là `succeeded` / `failed` / `canceled`. `POLL_TIMEOUT_MS` là 5 phút — quá thì throw. Output normalize về string URL qua `firstOutputUrl(output)`.

### Bảo mật token (con voi trong phòng)

Hôm nay token Replicate ở trong `VITE_REPLICATE_API_TOKEN` và được Vite bake vào bundle lúc build. **OK cho dev TestFlight, KHÔNG an toàn cho release public** — token có thể `grep` từ `ios/App/App/public/assets/*.js`. Step 5 của Imagine plan move call vào Amplify Function (Lambda): token sống trong env var Lambda, frontend chỉ tạo `ImagineJob` row và Lambda gọi Replicate.

Command kiểm tra "token nào đã ship":
```sh
grep -oE "r8_[A-Za-z0-9]{20,}" ios/App/App/public/assets/*.js
```

### License (con voi thứ hai)

- **IDM-VTON** license **CC BY-NC-SA 4.0** — chỉ non-commercial. Phải thay hoặc relicense trước commercial launch.
- **Flux.1-dev** (base của PuLID-Flux) cũng non-commercial.
- Ứng viên đang đánh giá: `kwaivgi/kling-virtual-try-on` (commercial), CatVTON, OOTDiffusion, FitDiT.

### Persistence flow (Step 4, planned — chưa ship)
1. User submit → frontend upload mockup PNG + face PNG vào `private/{identity_id}/imagine/{job_id}/`
2. Tạo `ImagineJob` row: `{ status: PENDING, designId, mockupKey, faceKey, modelKind, productId }`
3. Lambda (Step 5) fire, gọi Replicate, poll
4. Khi success: upload kết quả vào `protected/{identity_id}/imagine/{job_id}/result.png`, update row thành `status: SUCCEEDED, resultKey: ...`
5. Imagine gallery tab subscribe job change qua AppSync — UI update real-time

---

## Phần 9 — Tổng kết "Tại sao những lựa chọn này"

Dưới đây là tóm tắt một dòng cho mỗi lựa chọn lớn — đọc nhanh khi cần ôn lại trước demo.

| Lựa chọn | Lý do (một dòng) |
|---|---|
| **Vue 3 + Vite + Pinia** thay vì React/Next | Bundle nhỏ hơn, SFC ergonomics đơn giản hơn, `<script setup>` tách Three.js (imperative) khỏi UI reactive sạch sẽ |
| **Three.js** thay vì Babylon.js | Nhẹ hơn, hệ sinh thái lớn cho `GLTFLoader` + `OrbitControls`, không gắn với game engine concept |
| **Capacitor** thay vì React Native / native rewrite | Cùng codebase Vue cho web + iOS + Android. Critical với team nhỏ |
| **AWS Amplify Gen 2** thay vì Gen 1 | Code-first TypeScript (`defineAuth`, `defineData`, `defineStorage`), không interactive CLI, sandbox isolated per dev |
| **AppSync (GraphQL)** thay vì REST | Một round-trip per screen, typed contract, field-level `@auth`, subscription free |
| **DynamoDB** thay vì RDS/Postgres | Workload key-value, latency mili-giây, scale to zero cost, đúng shape AppSync |
| **Cognito** thay vì Auth0/Firebase | Một-stack AWS, free tier 50k MAU, tích hợp gốc với AppSync + S3 Identity Pool |
| **S3 SDK trực tiếp** thay vì Amplify Storage | Explicit hơn, dễ migrate khỏi Amplify nếu cần |
| **Replicate** thay vì self-host AI model | Không GPU ops, một HTTP API cho mọi model, billing per-second hợp per-user feature |
| **Per-product router (IDM-VTON + PuLID)** thay vì một model duy nhất | Không model nào preserve face + design + product geometry trên cả áo và đồ vật. Router pick best fit, UI copy honest về cái gì preserve được |
| **Single-stage IDM-VTON** thay vì 2-stage PuLID→IDM-VTON | 2-stage drop face identity ở mỗi re-paint. Single-stage với ảnh real preserve face exactly; ràng buộc chest-visibility được mitigate bằng silhouette guide + warning |
| **Auto-prompt** thay vì free-text prompt input | User không kỹ thuật hoặc để trống hoặc viết text mâu thuẫn. Template per-product emphasize ba điều thực sự control được (face/product/design exists) |
| **`CapacitorHttp`** thay vì `fetch` cho Replicate | WebView CORS chặn domain Replicate; CapacitorHttp route qua native và bypass |
| **`/v1/predictions` + version SHA** thay vì `/v1/models/{slug}/predictions` | Endpoint slug bị giới hạn cho official models; community model 404. Resolve version một lần, cache, dùng endpoint generic |
| **`cleanBackground` + `framePrintArea` capture mode** thay vì renderer hiện có | IDM-VTON không extract được garment từ capture nền dark; auto-zoom vào print area cho IDM-VTON nhiều pixel design để học |
| **Pinia store reset pattern trong Imagine** | Modal nhúng singleton `ThreeViewer` và gọi `viewerStore.reset()` lúc open/close/back để state không leak sang `/editor/:id` |

---

## Phần 9.5 — Vì sao chọn các AI model này (so sánh & lý do)

Phần này trả lời câu hỏi: *"Tại sao Replicate? Tại sao IDM-VTON cho áo? Tại sao PuLID-Flux cho face/object? Có lựa chọn khác không?"* — gom lại để dễ tra cứu khi review hoặc trình bày.

### 1. Provider — **Replicate** (so với fal.ai, Hugging Face, RunPod, self-host)

| Lựa chọn | Điểm mạnh | Vì sao bỏ qua |
|---|---|---|
| **Replicate** ✅ | Một REST API duy nhất cho mọi model; pin SHA qua field `version` → kết quả tái lập được; tính tiền theo giây, scale về 0 khi không dùng; community models (try-on + face) lên Replicate đầu tiên | — |
| fal.ai | Cold start nhanh hơn (~2× với FLUX), streaming gọn hơn | Catalog nhỏ hơn lúc chọn — không có IDM-VTON, PuLID host yếu hơn |
| HF Inference Endpoints | Gần "official source" nhất | Phải provision GPU riêng → tốn tiền giờ cả khi idle; không hợp prototype traffic bursty |
| RunPod / self-host A100 | Rẻ nhất tính theo inference khi scale lớn | Vài tuần MLOps cho một feature còn chưa ship |

**Yếu tố quyết định:** một shape HTTP duy nhất (`POST /v1/predictions` + poll) chạy được cho cả garment lẫn face route. Router trong `replicateClient.ts` chỉ swap `version` + `input` payload — không cần SDK thứ hai, không cần auth flow thứ hai.

### 2. Garment route — **IDM-VTON** (`cuuupid/idm-vton`)

Virtual try-on là một họ model riêng. Các ứng viên cân nhắc:

| Model | Điểm mạnh thực sự | Vì sao bỏ qua |
|---|---|---|
| **IDM-VTON** ✅ | SOTA trên VITON-HD benchmark cho "garment-on-person" — bảo toàn **printed graphic** (đúng cái mình cần) tốt nhất; nhận `garm_img + human_img + garment_des` native | License CC BY-NC-SA chặn launch thương mại — đã flag cho Step 5 swap |
| CatVTON | Nhỏ hơn / nhanh hơn | Mất chi tiết in nhỏ; logo bị nhoè rõ hơn IDM-VTON trong test của mình |
| OOTDiffusion | Mạnh ở full-outfit synthesis | Thiết kế cho outfit-swap, không cho việc preserve một **custom print** trên áo có sẵn |
| Kling Virtual Try-On (`kwaivgi/kling-virtual-try-on`) | License thương mại — giải quyết blocker license | Đắt hơn mỗi call; cần A/B trước khi swap. Đang trong shortlist Step 3.6. |
| FitDiT | Mới, hứa hẹn | Chưa có trên Replicate khi mình chọn; sẽ phải self-host |

**Lý do then chốt với mình:** IDM-VTON nhận **garment image** như input first-class (không phải chỉ text mô tả). Đó là thứ cho phép design của khách transfer lên áo thay vì bị model "hallucinate" ra design khác.

### 3. Face / object route — **PuLID-Flux** (`bytedance/flux-pulid`)

Plan ban đầu ghi *"PuLID-Flux first, InstantID fallback"*. Trade-off:

| Model | Điểm mạnh | Vì sao bỏ qua |
|---|---|---|
| **PuLID-Flux** ✅ | Identity preservation tốt nhất trong nhóm open-weights 2026; build trên FLUX.1-dev → output photoreal, prompt adherence tốt; một ảnh face là đủ | FLUX.1-dev non-commercial → cùng vấn đề Step 5 swap như IDM-VTON |
| InstantID | Nhanh hơn, nhẹ hơn | Identity drift nhiều hơn khi stylize; FLUX cho output sắc nét hơn |
| IP-Adapter FaceID | Controllable hơn | Identity preservation yếu hơn rõ rệt — mặt thường ra kiểu "inspired by" thay vì "đúng người" |
| PhotoMaker | Stack nhiều ảnh để cải thiện likeness | Cần 3-4 ảnh input; mình chỉ có một camera capture, không phát huy được |

**Lý do then chốt:** **một ảnh face → khuôn mặt nhận ra được**. Customer journey là một lần tap camera, không phải upload nhiều ảnh có hướng dẫn.

### 4. Vì sao dùng **router** thay vì một model duy nhất

Không có model nào hiện preserve được **face + design + product geometry** cùng lúc. Chia honest:

- **Garments → IDM-VTON** vì design nằm trên bề mặt áo, và IDM-VTON là họ model duy nhất nhận garment image như input first-class.
- **Faces / objects → PuLID-Flux** vì nó preserve identity mạnh nhất; design trên product trở thành "approximation hallucinated" (đã thừa nhận trong UI copy, và là lý do object route hiện đang ẩn — xem memory `project_imagine_garment_only_scope`).

Đó chính là lý do task next-session là *"cải thiện design fidelity trong output IDM-VTON"* (Step 3.6) chứ không phải *"tìm một model làm được cả hai"* — model như vậy chưa tồn tại ở chất lượng mình cần.

---

## Phần 10 — Cheat sheet (học thuộc)

- **Frontend:** Vue 3, TypeScript strict, Vite, Pinia, Tailwind CSS
- **3D:** Three.js + GLTFLoader + OrbitControls + CanvasTexture
- **Mobile:** Capacitor 5 (`appId: com.corjl.fabricon`, `appName: Try-It-On`), `@capacitor/camera`, `CapacitorHttp`
- **Auth:** AWS Cognito User Pool, JWT trong localStorage
- **API:** AWS AppSync (GraphQL), schema code-first, `@auth(owner)`
- **DB:** DynamoDB, on-demand, một table per model
- **Storage:** S3, ba tier access (public/protected/private)
- **AI:** Replicate qua `CapacitorHttp` (bypass CORS); router per-product: `cuuupid/idm-vton` (áo) + `bytedance/flux-pulid` (face — UI ẩn). Auto-prompt từ `promptBuilder.ts`. Lambda proxy planned (Step 5).
- **Imagine capture:** `useExporter.captureBlob({ cleanBackground: true, framePrintArea: true })`; auto-frame trong `utils/framePrintArea.ts`.
- **Build:** pnpm, Vite (manual chunks: vue/three/aws), ESLint, Vitest, Playwright
- **Region:** ap-southeast-1
- **Cost:** ~$20/tháng + Replicate variable (~$0.01–0.05/generation cho garment route)
- **Blocker đang mở:** License CC BY-NC-SA của IDM-VTON · Flux.1-dev non-commercial · Token Replicate đang bundle vào iOS app (Step 5 sẽ fix)

Nếu được hỏi điều mình không biết: *"Tôi cần kiểm tra code để trả lời chính xác — ở mức kiến trúc thì tôi có thể nói..."* rồi quay về phần mình biết.
