# Corjl Try-It-On — Presentation Script & Study Guide

> Companion document to the Gamma deck: **Corjl Try-It-On**
> Audience: internal team / stakeholders · Duration: ~10 minutes · Language: bilingual EN + VI

---

## How to use this doc

- **Read top to bottom** to learn the deck end-to-end.
- **Deliver from sections 3–4** — speaker scripts (EN + VI) and per-slide tips.
- **Reference sections 1–2 and 5–6** for vocabulary, numbers to memorize, and Q&A prep.

---

## 1. Deck at a glance

| # | Slide | One-line takeaway |
|---|---|---|
| 1 | Corjl Try-It-On | Cross-platform 3D mockup studio + AI try-on, built for the phone. |
| 2 | The Problem | Today's tools are 2D + desktop-only, generic stock, or AI without workflow. |
| 3 | The Vision | Upload → Place on 3D → Spin & Export → Tap Imagine. One codebase, no prompts. |
| 4 | Core Feature 1 | 3D Mockup Studio: 9 models, auto-UV, lighting presets, multi-angle export. |
| 5 | Core Features 2 & 3 | Camera as design source + "Imagine" AI try-on, no prompts. |
| 6 | Imagine Workflow | Router → IDM-VTON (garment) or PuLID-Flux (face) → poll Replicate → show. |
| 7 | Tech Stack | Pyramid: AWS backend · Capacitor 5 · Vue 3 + Three.js · IDM-VTON + PuLID. |
| 8 | Technically Different | Real 3D, identity-preserving AI, mobile-native, serverless. |
| 9 | Who It's For | POD sellers, influencers, designers, gift shops/small brands. |
| 10 | Roadmap | Steps 1–2 done · Step 3 shipped · Step 4 hardening · Step 5 AR (research). |
| 11 | Close | One codebase, zero ops, zero prompts. |

---

## 2. Glossary — terms to know before you present

> If you can explain these in one sentence each, you can handle Q&A.

| Term | EN | VI |
|---|---|---|
| **UV mapping** | The 2D-to-3D coordinate system that places a flat texture onto a 3D mesh surface. | Hệ tọa độ 2D ánh xạ vào bề mặt 3D — quyết định texture nằm ở đâu trên mesh. |
| **Three.js** | The WebGL library we use to render 3D in the browser. | Thư viện WebGL tụi mình dùng để render 3D trong trình duyệt. |
| **ACESFilmic tone mapping** | A color-grading curve that makes 3D renders look cinematic instead of washed out. | Đường cong màu giúp ảnh 3D trông điện ảnh thay vì bị "phẳng". |
| **PCFSoft shadows** | Soft-edged shadows in Three.js — more realistic than hard shadows. | Đổ bóng mép mềm trong Three.js — thật hơn shadow cứng. |
| **`preserveDrawingBuffer: true`** | A Three.js renderer flag that lets us read pixels from the canvas — required to snapshot the 3D scene for AI input. | Cờ trong Three.js renderer cho phép đọc pixel từ canvas — bắt buộc để chụp scene 3D làm input cho AI. |
| **Capacitor 5** | Wrapper that packages the same web app into native iOS and Android shells. | Wrapper đóng gói cùng một web app thành native iOS và Android. |
| **AWS Amplify Gen 2** | Code-first (TypeScript) version of Amplify — infrastructure-as-code instead of CLI prompts. | Phiên bản code-first (TypeScript) của Amplify — infra-as-code thay vì CLI hỏi. |
| **AppSync GraphQL** | AWS-managed GraphQL API on top of DynamoDB. | GraphQL API managed sẵn của AWS, đứng trên DynamoDB. |
| **IDM-VTON** | "Improved Diffusion Model for Virtual Try-On" — the model that paints a garment onto a person photo while keeping their face. | Model AI vẽ trang phục lên ảnh người, giữ nguyên khuôn mặt. |
| **PuLID-Flux** | A face-identity-preserving image generator — we use it for face-driven products like mugs and phone cases. | Model AI tạo ảnh có giữ danh tính khuôn mặt — dùng cho sản phẩm thiên mặt như ly, ốp điện thoại. |
| **Replicate** | The cloud platform that hosts and runs IDM-VTON / PuLID for us — we don't own the GPUs. | Nền tảng cloud host và chạy IDM-VTON / PuLID — tụi mình không sở hữu GPU. |
| **Single-stage vs two-stage** | One model call vs chaining two. We chose single-stage because identity drops at each stage. | Một lần gọi model vs ghép hai lần. Tụi mình chọn single-stage vì danh tính rớt mỗi lần qua model. |
| **Serverless / scales to zero** | No always-on servers; you pay only when a user actually hits the system. | Không server chạy 24/7; chỉ trả tiền khi có người thực sự dùng. |
| **CC BY-NC-SA 4.0 / non-commercial** | A license that forbids commercial use — that's why IDM-VTON and Flux.1-dev are launch blockers. | Giấy phép cấm dùng thương mại — đây là lý do IDM-VTON và Flux.1-dev là launch blocker. |

---

## 3. Numbers & names to memorize

> If someone interrupts you, these are the facts you'll need at hand.

- **9** product models · **7** live by default
- **4** lighting presets (Studio, Daylight, Dramatic, Flat)
- **4** guided steps in the Imagine modal · **0** prompts the user writes
- **~20–60 seconds** typical Replicate generation time
- **Poll every 2s**, timeout at **5 minutes**
- **3** platforms · **1** codebase (Web, iOS, Android)
- **Region**: `ap-southeast-1`
- **Key file names**: `replicateClient.ts` (router), `promptBuilder.ts` (auto-prompts)
- **Models in production**: IDM-VTON (garments), PuLID-Flux (face-driven)
- **Stack one-liner**: AWS Amplify Gen 2 · Cognito · AppSync · DynamoDB · S3 · Capacitor 5 · Vue 3 · Three.js · Replicate

---

## 4. Slide-by-slide script (EN + VI)

> Target: ~55s per slide. Trim a sentence if running long. Speak from the **bold** anchors if you lose the thread.

### Slide 1 — Title

**EN:** Hi everyone. Today I'm walking you through **Corjl Try-It-On** — what we've been building in Corjl Labs. The short version: it's a cross-platform 3D mockup studio with AI virtual try-on, designed for the phone in your pocket. By the end of this talk you'll know **what it does, how it works, who it's for, and what's left before we can ship.**

**VI:** Chào mọi người. Hôm nay mình giới thiệu về **Corjl Try-It-On** — sản phẩm tụi mình đang xây ở Corjl Labs. Nói ngắn gọn: một studio mockup 3D đa nền tảng kết hợp AI thử đồ ảo, thiết kế để chạy ngay trên điện thoại trong túi. Sau bài này mọi người sẽ nắm được **nó làm gì, hoạt động ra sao, dành cho ai, và còn gì cần làm trước khi ra mắt.**

---

### Slide 2 — The Problem with Today's Mockup Tools

**EN:** Let's start with **why** we're building this. Three problems with mockup tools today. **One** — they're flat 2D overlays built for desktop; mobile-first creators don't have an end-to-end solution in their pocket. **Two** — stock mockups show someone else's face on someone else's shirt; they don't show *your* customer wearing *your* design. **Three** — generic AI image generators make pretty pictures, not usable product mockups; they're disconnected from any real print-on-demand workflow. Try-It-On closes all three gaps in one product.

**VI:** Bắt đầu bằng **vì sao** tụi mình làm. Tool mockup hiện tại có ba vấn đề. **Một** — đa số là overlay 2D, làm cho desktop; người sáng tạo mobile-first không có giải pháp end-to-end. **Hai** — ảnh stock là người khác mặc áo của người khác — không phải *khách của bạn* mặc *thiết kế của bạn*. **Ba** — generator AI ảnh chỉ tạo ảnh đẹp, không phải mockup sản phẩm dùng được; tách rời khỏi quy trình print-on-demand. Try-It-On giải quyết cả ba trong một sản phẩm.

---

### Slide 3 — The Vision: Your Personal Product Studio

**EN:** Our vision: a **personal product studio in four steps** — Upload, Place on 3D, Spin & Export, Tap Imagine. Upload your artwork. It lands UV-correct on a real 3D model. Spin the camera, export the angles. Tap **Imagine** and the AI generates a photo of an actual person wearing it. One codebase on Web, iOS, and Android — powered by serverless AWS and Replicate. **No desktop required. No prompt to write.**

**VI:** Tầm nhìn: **studio sản phẩm cá nhân, bốn bước** — Upload, đặt lên 3D, xoay & export, bấm Imagine. Upload thiết kế — tự gắn đúng UV trên 3D thật. Xoay camera, export góc cần. Bấm **Imagine**, AI tạo ảnh người thật đang mặc nó. Một codebase trên Web, iOS, Android — serverless AWS, AI chạy trên Replicate. **Không cần desktop. Không cần viết prompt.**

---

### Slide 4 — Core Feature 1: 3D Mockup Studio

**EN:** Feature one — the **3D Mockup Studio**. A live, interactive preview in Three.js — UV-correct texture placement, real lighting, full orbit controls, in the browser or on the phone. **Nine product models** — t-shirt, hoodie, polo, tote, mug, phone case, standee — seven live. **Auto-fit UV mapping**: drop the design in, it lands on the printable surface every time. Four **lighting presets** — Studio, Daylight, Dramatic, Flat — plus color picker and ground shadow. And **multi-angle export** with batch PNG/JPEG, including turntable GIF.

**VI:** Feature một — **3D Mockup Studio**. Preview tương tác trong Three.js — UV chuẩn, ánh sáng thật, xoay tự do, ngay trên trình duyệt hoặc điện thoại. **Chín mô hình** — áo thun, hoodie, polo, tote, ly, ốp điện thoại, standee — bảy đã live. **Auto-fit UV mapping**: kéo thiết kế vào, tự nằm đúng vùng in. Bốn **preset ánh sáng** — Studio, Daylight, Dramatic, Flat — kèm color picker và ground shadow. **Export đa góc**, batch PNG/JPEG, kể cả turntable GIF.

---

### Slide 5 — Core Features 2 & 3: Camera + AI Try-On

**EN:** Features two and three turn the phone into a creative tool. The **camera becomes a design source** — capture a sketch, fabric swatch, anything in the world, and it feeds the same upload pipeline as a desktop design. Works offline up to the point of upload. The signature feature is **"Imagine"** — AI virtual try-on. Four guided steps, no prompt to type. Pick a design, pose the 3D mockup, capture a face photo with the on-screen silhouette guide, tap Generate. Auto-generated prompts fire per product. Replicate runs the route in **~20–60 seconds** and the result appears inline. The user never writes a single word.

**VI:** Feature hai và ba biến điện thoại thành công cụ sáng tạo. **Camera trở thành nguồn thiết kế** — chụp bản vẽ tay, mẫu vải, hoặc bất cứ thứ gì ngoài đời, đi thẳng vào cùng pipeline upload với thiết kế desktop. Hoạt động offline đến lúc upload. Feature đáng chú ý nhất là **"Imagine"** — AI thử đồ ảo. Bốn bước, không cần viết prompt. Chọn thiết kế, đặt dáng mockup 3D, chụp mặt theo silhouette guide, bấm Generate. Prompt tự sinh theo từng sản phẩm. Replicate xử lý trong **~20–60 giây**, kết quả hiện inline. Người dùng không gõ một chữ nào.

---

### Slide 6 — The Imagine Workflow, End to End

**EN:** Here's how Imagine actually works. **Two inputs** — the 3D mockup snapshot and a face photo. They hit a **router** in `replicateClient.ts` that classifies by product kind. **Garment** → IDM-VTON with garment image, human image, and garment description. **Face-driven** (mug, phone case) → PuLID-Flux with the face image and a prompt. We poll Replicate every 2 seconds, timeout at 5 minutes, then display in the Imagine modal. Prompts from `promptBuilder.ts` emphasize **face identity, product noun, and design visibility** — the three things the model can actually control. S3 persistence and the Lambda proxy are Step 4 and Step 5.

**VI:** Đây là cách Imagine chạy. **Hai input** — snapshot 3D mockup và ảnh mặt. Đi qua **router** trong `replicateClient.ts`, router phân loại theo loại sản phẩm. **Áo quần** → IDM-VTON với ảnh áo, ảnh người, mô tả trang phục. **Sản phẩm thiên mặt** (ly, ốp điện thoại) → PuLID-Flux với ảnh mặt và prompt. Poll Replicate mỗi 2 giây, timeout 5 phút, rồi hiện trong modal Imagine. Prompt từ `promptBuilder.ts` nhấn mạnh **danh tính khuôn mặt, danh từ sản phẩm, và độ rõ thiết kế** — ba thứ model thật sự kiểm soát được. S3 persistence và Lambda proxy là Step 4 và Step 5.

---

### Slide 7 — Tech Stack & AI Engine

**EN:** The architecture is a pyramid with four layers. **Backend** at the base — AWS Amplify Gen 2, Cognito for auth, AppSync GraphQL, DynamoDB, S3 with three-tier access. **Mobile & cross-platform** is Capacitor 5 — one codebase compiled for iOS, Android, Web. **Frontend & 3D rendering** is Vue 3 plus Three.js — UV mapping, ACESFilmic tone mapping, PCFSoft shadows. At the top, **AI models & routing** — IDM-VTON for garment placement, PuLID-Flux for face identity, orchestrated through Replicate. Everything serverless, scales to zero, pay-per-use.

**VI:** Kiến trúc là kim tự tháp bốn tầng. **Backend** ở đáy — AWS Amplify Gen 2, Cognito auth, AppSync GraphQL, DynamoDB, S3 ba lớp truy cập. **Mobile & cross-platform** là Capacitor 5 — một codebase compile cho iOS, Android, Web. **Frontend & 3D rendering** là Vue 3 + Three.js — UV mapping, ACESFilmic tone mapping, PCFSoft shadows. Trên đỉnh là **AI models & routing** — IDM-VTON cho garment, PuLID-Flux cho khuôn mặt, điều phối qua Replicate. Tất cả serverless, scale về zero, trả tiền theo lượt dùng.

---

### Slide 8 — What Makes It Technically Different

**EN:** Four things set this apart. **One — Real 3D, not flat overlays.** Three.js with UV-correct placement, ACESFilmic, PCFSoft shadows, damped orbit controls. `preserveDrawingBuffer: true` is what lets us take headless snapshots for the Imagine pipeline. **Two — Identity-preserving AI.** Single-stage IDM-VTON takes the user's real photo as `human_img` and keeps face identity through the re-paint. We tested a two-stage PuLID → IDM-VTON pipeline and **rejected it** because identity dropped on each stage. **Three — Mobile-native by default.** Capacitor 5 wraps the same Vue 3 app — camera, filesystem, safe-area, status bar, keyboard all wired in. **Four — Serverless AWS.** Pay-per-use, scales to zero, zero ops overhead.

**VI:** Bốn điều khác biệt. **Một — 3D thật, không phải overlay 2D.** Three.js với UV chuẩn, ACESFilmic, PCFSoft shadows, orbit controls có damping. `preserveDrawingBuffer: true` là cờ giúp chụp snapshot headless cho pipeline Imagine. **Hai — AI giữ danh tính.** IDM-VTON single-stage nhận ảnh thật làm `human_img`, giữ nguyên khuôn mặt qua re-paint. Tụi mình từng test pipeline hai bước PuLID → IDM-VTON nhưng **bỏ** vì danh tính rớt ở mỗi bước. **Ba — Mobile-native ngay từ đầu.** Capacitor 5 đóng gói cùng một Vue 3 app — camera, filesystem, safe-area, status bar, bàn phím đều wire sẵn. **Bốn — Serverless AWS.** Trả theo lượt dùng, scale về zero, không tốn người ops.

---

### Slide 9 — Who It's Built For

**EN:** Four target users. **Print-on-demand sellers** — show customers themselves wearing the product before they buy, which lifts conversion. **Influencers and creators** — generate "wearing the merch" promo shots without a photoshoot. **Designers** — sanity-check artwork on a real 3D garment in seconds from the phone. **Gift shops and small brands** — let any buyer upload their face for a one-of-one personalized mockup. Common thread — all four are **mobile-first creators** who today either pay for a desktop tool or settle for generic stock.

**VI:** Bốn nhóm. **Print-on-demand sellers** — cho khách thấy chính họ đang mặc sản phẩm trước khi mua, tăng conversion. **Influencers và creators** — tạo ảnh "đang mặc merch" mà không cần photoshoot. **Designers** — kiểm tra thiết kế trên áo 3D thật trong vài giây, ngay trên điện thoại. **Gift shops và small brands** — cho từng khách upload mặt để có mockup one-of-one. Điểm chung — đều là **mobile-first creators**, hiện tại hoặc trả tiền cho desktop tool, hoặc chấp nhận stock generic.

---

### Slide 10 — Roadmap

**EN:** Where we are. **Step 1, Foundation** — auth, project structure, CI — complete. **Step 2, 3D Mockup Studio** — nine models, lighting presets, multi-angle export — complete. **Step 3, Imagine AI Try-On** — four-step modal, Replicate routing, auto-prompt, auto-frame capture — shipped. S3 persistence and the Lambda proxy in progress. **Step 4, Production Hardening** — Lambda token proxy, IDM-VTON parameter tuning at 40 steps with `force_dc`, and critically, **replacing the non-commercial model licenses** before launch. **Step 5, AR Preview** — ARKit/ARCore, in research. The same 3D + camera + identity-aware AI stack is what AR plugs into. One callout — **IDM-VTON is CC BY-NC-SA 4.0 and Flux.1-dev is non-commercial.** These are **launch blockers**. We must ship replacements before any public release.

**VI:** Vị trí hiện tại. **Step 1, Foundation** — auth, cấu trúc project, CI — xong. **Step 2, 3D Mockup Studio** — chín mô hình, lighting presets, multi-angle export — xong. **Step 3, Imagine AI Try-On** — modal bốn bước, routing Replicate, auto-prompt, auto-frame capture — đã ship. S3 persistence và Lambda proxy đang làm. **Step 4, Production Hardening** — Lambda token proxy, tune IDM-VTON ở 40 bước với `force_dc`, và quan trọng nhất — **thay license non-commercial** trước khi launch. **Step 5, AR Preview** — ARKit/ARCore, đang research. Stack 3D + camera + AI identity-aware là cái AR sẽ plug vào. Một điểm cần nhấn — **IDM-VTON đang là CC BY-NC-SA 4.0 và Flux.1-dev cũng non-commercial.** Đây là **launch blocker**. Phải có model thay thế trước khi public release.

---

### Slide 11 — Close

**EN:** To close — **your design, your face, your product.** Corjl Try-It-On bridges 3D product visualization and generative AI in a workflow normal people can actually use, from the phone already in their pocket. Three things to remember — **One Codebase** across Web, iOS, Android. **Zero Ops**, serverless, scales to zero. **Zero Prompts**, auto-generated per product. A Corjl product, built in `ap-southeast-1`, powered by AWS Serverless and Replicate. Happy to take questions.

**VI:** Để kết — **thiết kế của bạn, khuôn mặt của bạn, sản phẩm của bạn.** Corjl Try-It-On kết nối 3D product visualization với generative AI trong một workflow người dùng bình thường thực sự dùng được, ngay từ điện thoại trong túi. Ba điểm — **One Codebase** trên Web, iOS, Android. **Zero Ops**, serverless, scale về zero. **Zero Prompts**, tự sinh theo từng sản phẩm. Một sản phẩm của Corjl, build tại `ap-southeast-1`, chạy trên AWS Serverless và Replicate. Mình sẵn sàng nhận câu hỏi.

---

## 5. Per-slide delivery tips

| Slide | Tip |
|---|---|
| 1 | Don't read the subtitle — paraphrase. Keep eye contact, set expectations for the rest of the talk. |
| 2 | **Pause** after each of the three problems — let each one land. |
| 3 | Trace the four steps with your hand if presenting in person. The visual is doing half the work. |
| 4 | Drop one concrete number — "9 models" — early. It signals scope. |
| 5 | Emphasize **"never writes a single word"** — that's the differentiating UX claim. |
| 6 | This is your **technical credibility slide**. Slow down. Trace the diagram in order: Inputs → Router → Garment/Face → Poll → Display. |
| 7 | Don't read every layer. Say "bottom to top" and let the pyramid speak. |
| 8 | The two-stage rejection (PuLID → IDM-VTON) is a strong signal of engineering rigor. Don't skip it. |
| 9 | If short on time, this is the easiest slide to compress — just name the four groups. |
| 10 | **Address the launch blocker head-on.** If you skip it, the first question will be about it. |
| 11 | End on the three "ones": **one codebase, zero ops, zero prompts.** Then stop talking. |

---

## 6. Likely Q&A (and recommended answers)

**Q: Why Replicate and not host the models ourselves?**
> A: GPU economics. Replicate charges per-second of inference; self-hosting an H100 is ~$2/hr whether anyone's using it or not. At early-stage volume, Replicate wins. We'll re-evaluate when daily generations cross the break-even point.

**Q: What's the actual latency a user sees?**
> A: 20 to 60 seconds end-to-end for most products. We poll every 2 seconds. The 3D snapshot and face capture are instant; the wait is purely Replicate inference time.

**Q: How big is the launch-blocker license problem?**
> A: Real but solvable. IDM-VTON (CC BY-NC-SA 4.0) and Flux.1-dev are non-commercial. We need to swap to commercially-licensed equivalents — candidates exist on Replicate. The work is in re-tuning prompts and parameters for the new models, not architectural change.

**Q: Why Capacitor instead of React Native or Flutter?**
> A: We already have a Vue 3 web app — Capacitor lets us ship to iOS and Android **without rewriting the UI**. Three.js works inside the Capacitor WebView. React Native or Flutter would have meant porting the 3D layer twice.

**Q: How does auto-fit UV mapping handle weird-aspect designs?**
> A: We normalize the design's bounding box to the printable region defined in the model's UV layout, preserving aspect ratio. If the design is wider than the print area, it scales down to fit width; if taller, it scales to fit height.

**Q: Why single-stage IDM-VTON instead of stacking PuLID for identity + IDM-VTON for garment?**
> A: We tested it. Each model pass loses some facial fidelity. By the time PuLID's face passed through IDM-VTON's diffusion, identity had drifted noticeably. IDM-VTON alone, fed the real photo as `human_img`, preserves identity better in a single pass.

**Q: What about AR? When?**
> A: Step 5, after Production Hardening. ARKit on iOS, ARCore on Android. The good news — our 3D + camera + identity-aware AI stack is exactly what AR needs. AR is an integration step, not a rebuild.

**Q: What's the cost per generation?**
> A: Roughly the Replicate per-run cost (varies by model — IDM-VTON is on the order of cents per run). We'll cover specific economics in the business review, not this deck.

**Q: Can it handle group photos or multiple people?**
> A: Not in v1. IDM-VTON is single-subject. Multi-subject is a future enhancement.

---

## 7. Quick timing reference

| Section | Target | Cumulative |
|---|---|---|
| Slide 1 (Title) | 0:40 | 0:40 |
| Slide 2 (Problem) | 0:55 | 1:35 |
| Slide 3 (Vision) | 0:50 | 2:25 |
| Slide 4 (Studio) | 0:55 | 3:20 |
| Slide 5 (Camera + AI) | 1:00 | 4:20 |
| Slide 6 (Workflow) | 1:10 | 5:30 |
| Slide 7 (Stack) | 0:55 | 6:25 |
| Slide 8 (Different) | 1:00 | 7:25 |
| Slide 9 (Users) | 0:45 | 8:10 |
| Slide 10 (Roadmap) | 1:00 | 9:10 |
| Slide 11 (Close) | 0:40 | 9:50 |

**Total: ~10 minutes.** Leave 5+ minutes for Q&A.

---

*Last updated: 2026-05-21 · Corjl Labs · Rowboat Software*
