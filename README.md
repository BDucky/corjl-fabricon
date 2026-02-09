# Fabricon - Next-Generation Design Platform

Cross-platform design editor with 2D canvas editing, 3D mockup previews, and mobile capabilities for AR/Camera integration.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- AWS Account with Amplify CLI
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file and update with your AWS credentials
cp .env.example .env.local

# Initialize Capacitor
npx cap init
npx cap add ios
npx cap add android

# Initialize AWS Amplify (if not already done)
amplify init
amplify add auth
amplify add api
amplify add storage
amplify push
```

### Development

```bash
# Start dev server
npm run dev

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Type checking
npm run type-check

# Linting
npm run lint

# E2E tests
npm run e2e
npm run e2e:ui
```

### Mobile Development

```bash
# Sync web code to native
npm run capacitor:sync

# Open iOS project
npm run capacitor:open:ios

# Open Android project
npm run capacitor:open:android
```

## Project Structure

```
corjl-fabricon/
├── amplify/                     # AWS Amplify backend
├── src/
│   ├── components/              # Shared UI components
│   ├── modules/                 # Feature modules (editor, templates, projects, mobile)
│   ├── services/                # AWS API and storage services
│   ├── stores/                  # Pinia state management
│   ├── views/                   # Page components
│   ├── router/                  # Vue Router configuration
│   ├── types/                   # TypeScript type definitions
│   ├── style.css                # Global styles with Tailwind
│   ├── main.ts                  # App entry point
│   └── App.vue                  # Root component
├── tests/                       # Test files
├── public/                      # Static assets
├── vite.config.ts              # Vite configuration
├── capacitor.config.ts         # Capacitor configuration
└── tailwind.config.js          # Tailwind CSS configuration
```

## Implementation Phases

### Phase 1: Foundation (Current)
- ✓ Project structure and configuration
- ✓ Authentication (Cognito sign-up/login)
- ✓ Base UI components
- ⬜ AWS Amplify setup completion

**Next**: Run `npm install` and verify dev server starts

### Phase 2: 2D Editor Core
- Fabric.js canvas integration
- Object manipulation (text, shapes, images)
- Layer management
- Undo/redo history

### Phase 3: Template System
- Template library view
- GraphQL queries/mutations
- Project persistence

### Phase 4: 3D Viewer
- Three.js integration
- Model loading (GLB/GLTF)
- Texture mapping from 2D canvas

### Phase 5: View Synchronization
- 2D/3D view toggles
- Split-view mode
- Camera synchronization

### Phase 6: Mobile Optimization
- Safe area handling
- Touch gestures
- Device testing

### Phase 7: Camera Integration
- Camera plugin
- Photo import
- S3 upload

### Phase 8: Polish & Production
- Error handling
- Performance optimization
- Full test coverage

### Phase 9: AR Preparation
- ARKit/ARCore research
- AR plugin architecture

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your AWS credentials:

```
VITE_AWS_REGION=us-west-2
VITE_COGNITO_USER_POOL_ID=your-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_APPSYNC_ENDPOINT=your-appsync-endpoint
VITE_S3_BUCKET=your-bucket-name
```

## Testing

Tests run continuously throughout development:

```bash
# Watch mode
npm run test

# With UI dashboard
npm run test:ui

# Coverage report
npm run test:coverage
```

## Architecture

### Data Flow
```
User Input → EditorCanvas.vue
    ↓
FabricCanvas + ObjectManager Store + ThreeViewer
    ↓
AWS AppSync (GraphQL)
    ↓
DynamoDB + S3
```

### State Management
- **Auth Store**: User authentication and session
- **Editor Store**: View mode, zoom, pan
- **Object Manager Store**: Canvas objects and layers
- **Canvas History Store**: Undo/redo

## Key Technologies

- **Frontend**: Vue 3, TypeScript, Tailwind CSS
- **Build**: Vite
- **State Management**: Pinia
- **Canvas**: Fabric.js (2D), Three.js (3D)
- **Backend**: AWS Amplify, AppSync, DynamoDB
- **Mobile**: Capacitor, Camera, Filesystem
- **Testing**: Vitest, Playwright
- **Mobile Platforms**: iOS (Xcode), Android (Studio)

## Security

- AWS IAM roles and policies
- Cognito authentication
- Field-level auth on GraphQL
- Signed S3 URLs for uploads
- Input validation on all API calls

## Performance Targets

- 60fps canvas rendering
- <3s project load time
- <2MB bundle size (before vendor)
- Works offline with local caching

## Contributing

1. Create a feature branch
2. Make changes
3. Run tests: `npm run test`
4. Type check: `npm run type-check`
5. Lint: `npm run lint`
6. Commit with clear messages

## License

Proprietary - Corjl Inc.
