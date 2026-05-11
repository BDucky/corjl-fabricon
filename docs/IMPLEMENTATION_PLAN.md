# Fabricon Implementation Plan
## Next-Generation Design Platform

**Project Status**: Phase 1 Complete ✓ | Phase 2: In Progress

---

## Project Vision

Building a **cross-platform 3D product mockup platform** (similar to Corjl) with:
- Single codebase for Web & Mobile (iOS/Android)
- 3D product mockup previews (Three.js)
- Design upload and placement on 3D models
- AWS serverless backend (Amplify, AppSync, DynamoDB, S3)
- Mobile-native features via Capacitor (Camera, future AR)

---

## Architecture Overview

### Component Data Flow

```
User Input → EditorView.vue (Orchestrator)
                    ↓
    ┌───────────────┼───────────────┐
    ↓               ↓               ↓
DesignInput   Viewer3D Store   ThreeViewer
  (Upload)  ←→  (Pinia)  ←→  (3D Preview)
                    ↓
              AWS AppSync (GraphQL)
                    ↓
          DynamoDB + S3
```

### Key Technologies

- **Frontend**: Vue 3, TypeScript, Tailwind CSS, Pinia
- **Build**: Vite
- **3D**: Three.js
- **Backend**: AWS Amplify, AppSync, DynamoDB, S3
- **Mobile**: Capacitor, Camera, Filesystem
- **Testing**: Vitest, Playwright
- **Package Manager**: pnpm

---

## Project Structure

```
corjl-fabricon/
├── docs/                             # Documentation
│   ├── IMPLEMENTATION_PLAN.md        # This file
│   ├── ARCHITECTURE.md               # Detailed architecture
│   └── PHASES.md                     # Phase breakdown
├── amplify/                          # AWS Amplify backend
│   └── backend/
│       ├── api/corjlapi/
│       │   └── schema.graphql        # GraphQL schema
│       ├── auth/corjlauth/
│       └── storage/corjlstorage/
├── src/
│   ├── components/                   # Shared UI components
│   │   ├── ui/                       # BaseButton, BaseInput, BaseModal
│   │   └── layout/                   # AppHeader, SafeAreaWrapper
│   ├── modules/                      # Feature modules
│   │   ├── editor/                   # 2D/3D Editor module
│   │   │   ├── components/
│   │   │   ├── composables/
│   │   │   ├── stores/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── templates/                # Template library
│   │   ├── projects/                 # Project management
│   │   └── mobile/                   # Mobile features
│   ├── services/
│   │   ├── api/graphql/              # AppSync client
│   │   └── storage/                  # S3 upload
│   ├── stores/                       # Pinia state management
│   ├── router/                       # Vue Router
│   ├── types/                        # TypeScript definitions
│   ├── views/                        # Page components
│   ├── style.css                     # Global styles
│   └── main.ts                       # Entry point
├── tests/
│   ├── unit/                         # Unit tests
│   ├── integration/                  # Integration tests
│   └── e2e/                          # E2E tests
├── public/                           # Static assets
│   ├── models/                       # 3D models
│   └── images/
├── vite.config.ts                    # Vite config
├── capacitor.config.ts               # Capacitor config
├── tailwind.config.js                # Tailwind config
├── vitest.config.ts                  # Testing config
├── playwright.config.ts              # E2E testing
├── eslint.config.js                  # Linting
├── tsconfig.json                     # TypeScript
├── pnpm-workspace.yaml               # pnpm workspace
└── package.json
```

---

## AWS Backend Schema

### GraphQL Types

**DesignTemplate** - Reusable design templates
- Dimensions: width, height, depth (inches)
- 3D assets: modelUrl, modelThumbnailUrl, uvMappingData
- 2D data: layerData (Fabric.js JSON)
- Previews: previewImageUrl, preview3DImageUrl
- Metadata: tags, isPremium, isPublic, version

**DesignProject** - User's working projects
- Fields: id, name, templateId, canvasData, status (DRAFT/PUBLISHED/ARCHIVED)
- 3D settings: selectedViewAngle, lightingPreset
- Relationships: template, assets, exports

**ProjectAsset** - Images, fonts, models, textures
- Types: IMAGE, FONT, MODEL, TEXTURE
- Tracking: usageCount, fileSize, mimeType

**ProjectExport** - Export history
- Types: PNG, PDF, JPEG, SVG, GLB
- Stores: fileUrl, fileName, fileSize

**UserProfile** - User data and subscription
- Subscription tiers: FREE, PRO, ENTERPRISE
- Preferences: UI settings (JSON)

### S3 Folder Structure

```
corjl-storage-{env}/
├── public/templates/{templateId}/
│   ├── preview.jpg (512x512)
│   ├── preview-3d.jpg (1024x1024)
│   ├── model.glb
│   └── textures/
├── protected/{identityId}/projects/{projectId}/
│   ├── canvas-state.json
│   ├── preview.jpg
│   └── assets/images/
└── private/{identityId}/uploads/originals/
```

---

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETE
**Duration**: Week 1-2 | **Status**: Verified & Tested

**Deliverables:**
- [x] Project structure and configuration
- [x] All config files (Vite, TypeScript, Tailwind, Capacitor, etc)
- [x] AWS Amplify GraphQL schema
- [x] Authentication module (Cognito sign-up/login)
- [x] Base UI components (Button, Input, Modal)
- [x] Views (Login, Signup, Projects, Templates, Editor)
- [x] Pinia stores (Auth store)
- [x] Testing infrastructure (Vitest + Playwright)
- [x] Type checking: PASSES ✓
- [x] Linting: PASSES ✓
- [x] Build: SUCCESS ✓

**Key Architecture Decisions:**
- Cognito User Pools for auth
- Token stored in localStorage
- Auto-initialization on app load
- Pinia for state management
- Tailwind CSS for styling

---

### Phase 2: 3D Mockup Studio ✅ COMPLETE
**Duration**: Week 3-5 | **Status**: Complete

**Deliverables:**
- [x] Three.js scene setup (camera, lighting, renderer)
- [x] GLB/GLTF model loader with 9 bundled product models
- [x] OrbitControls camera with presets
- [x] Design image upload and texture mapping to 3D models
- [x] Per-model auto-fit with UV-aware texture placement
- [x] Drag-to-reposition design on 3D model surface
- [x] Lighting presets (Studio, Daylight, Dramatic, Flat)
- [x] Product color customization
- [x] Multi-angle export
- [x] Ground shadow and auto-rotate

---

### Phase 3: Template System
**Duration**: Week 6

**Requirements:**
- Implement GraphQL queries for templates
- Template library view with search/filter
- Create project from template flow
- Save/load projects to DynamoDB
- Auto-save feature

**Output:**
- Template library functional
- Projects persisted to AWS
- Template-based creation

---

### Phase 4: Mobile Optimization
**Duration**: Week 9

**Requirements:**
- Safe area handling
- Mobile-optimized toolbar
- Touch gesture support (pinch-zoom, pan, etc)
- Responsive layouts

**Testing:**
- iOS device testing
- Android device testing
- Performance optimization

**Output:**
- Mobile-optimized UI
- Touch gestures working
- Tested on real devices

---

### Phase 5: Camera Integration
**Duration**: Week 8

**Requirements:**
- Capacitor Camera plugin integration
- Photo capture from device
- Gallery import
- Image upload to S3

**Output:**
- Camera capture working
- Photo import functional

---

### Phase 6: Polish & Production
**Duration**: Week 9-10

**Requirements:**
- Error handling and error boundaries
- Loading states
- User feedback (toasts, notifications)
- Bundle size optimization
- Lazy loading
- Full test coverage (unit, integration, E2E)

**Output:**
- Production-ready app
- Full test coverage
- Documentation complete
- Performance optimized

---

### Phase 7: AR Preparation
**Duration**: Week 11

**Requirements:**
- ARKit/ARCore research
- AR plugin architecture design
- `useARViewer.ts` placeholder
- Model preparation guidelines

**Output:**
- AR architecture designed
- Foundation for future AR features

---

## State Management Architecture

### Pinia Stores

**authStore** (Phase 1 ✓)
```typescript
- user: User | null
- token: string | null
- isAuthenticated: boolean
- isLoading: boolean
- error: string | null
- Actions: signup, signin, logout, confirmSignup, resetPassword
```

**viewer3dStore** (Phase 2 ✓)
```typescript
- activeModelId, designImageUrl, textureMappingConfig
- lightingPresetId, cameraPresetId, backgroundColor
- productColor, autoRotate, showGroundShadow
- exportSettings, isExporting
- Actions: selectModel, autoFitDesign, setDesignFromFile/Url, export
```

**projectStore** (Phase 3)
```typescript
- currentProject: DesignProject | null
- projects: DesignProject[]
- isLoading: boolean
- Actions: createProject, loadProject, saveProject, deleteProject
```

**templateStore** (Phase 3)
```typescript
- templates: DesignTemplate[]
- selectedTemplate: DesignTemplate | null
- isLoading: boolean
- Actions: loadTemplates, createFromTemplate
```

---

## Performance Targets

### 3D (Three.js)
- 60fps rendering
- LOD (Level of Detail) for complex models
- Frustum culling
- Compressed textures (KTX2)
- Resource disposal on cleanup

### Mobile
- Max texture size: 2048x2048
- Lower polygon count models
- Disable expensive effects (shadows)
- Progressive loading
- Lazy load components

### Bundle
- Target: < 250KB (gzipped)
- Code splitting by route
- Lazy load editor modules
- Tree-shake unused dependencies

---

## Security Considerations

### AWS IAM
- S3: Public read for templates, authenticated for uploads
- AppSync: Cognito User Pools auth
- Field-level auth with `@auth` directive

### Input Validation
- Client: File types/sizes, text sanitization
- Server: Lambda resolver validation, rate limiting
- S3: Pre-signed URLs with expiration

---

## Development Workflow

### Each Phase Should:
1. **Plan** - Update this document with requirements
2. **Implement** - Write code following architecture
3. **Test** - Write tests (unit, integration, E2E)
4. **Verify** - All checks pass (type, lint, build, tests)
5. **Document** - Update README and docs
6. **Review** - Check against original requirements

### Code Quality Checks (Every Phase)
```bash
pnpm run type-check    # TypeScript checking
pnpm run lint          # Linting + formatting
pnpm run build         # Production build
pnpm run test          # Unit tests
pnpm run test:coverage # Coverage report
pnpm run e2e           # E2E tests
```

---

## Success Metrics

### Functional Requirements
- [x] All core features working (2D edit, 3D preview, save/load)
- [ ] Mobile working on iOS and Android
- [ ] AWS backend functional (API calls, file uploads)
- [ ] All tests passing

### Performance Requirements
- [ ] 60fps canvas rendering
- [ ] < 3s project load time
- [ ] < 250KB bundle (gzipped)
- [ ] Mobile-optimized performance

### Code Quality
- [ ] TypeScript: No errors
- [ ] ESLint: Passing
- [ ] Test coverage: > 80%
- [ ] Bundle optimized

### User Experience
- [ ] Smooth 2D/3D transitions
- [ ] Responsive mobile UI
- [ ] Clear error messages
- [ ] Fast load times

---

## Important Notes for Future Development

### Auto-Save vs Explicit Save
- **Auto-save**: Cached to localStorage every 2 seconds (performance)
- **Explicit save**: Ctrl+S or Save button (user control)
- **Server sync**: Debounced GraphQL mutation

### 3D Model Preparation
- Accept user-uploaded GLB/GLTF files
- Validate texture resolution (max 2048x2048)
- Store in S3 with optimization
- Support UV mapping configuration

### Mobile Considerations
- Safe area utilities included (Tailwind)
- Touch gesture support (Phase 6)
- Camera integration via Capacitor (Phase 7)
- Test on real devices (not just simulator)

### AWS Configuration
- Use environment variables for all credentials
- Separate dev/staging/prod stacks
- Enable CloudWatch logging for debugging
- Monitor DynamoDB usage (on-demand pricing)

---

## Document Versioning

**Version**: 1.0
**Last Updated**: 2026-02-09
**Phase**: 1 Complete, Phase 2 Starting
**Next Review**: End of Phase 2

### Changes Log
- v1.0: Initial plan created during Phase 1 setup
