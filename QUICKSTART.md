# Fabricon Quick Start Guide

## Phase 1 Complete ✅

The project foundation is fully set up and verified. All files are created, dependencies installed, and code quality checks pass.

## Before You Start Development

### 1. Set Up AWS Amplify

```bash
# Initialize Amplify (follow prompts)
amplify init

# Add authentication
amplify add auth
# Select: Cognito User Pool
# Email as sign-in method
# Standard (username, email, phone) attribute
# No MFA
# Email recovery only

# Add GraphQL API
amplify add api
# Select: GraphQL
# API key auth (for public access)
# Single object with fields
# Use existing schema: YES
# Point to: amplify/backend/api/corjlapi/schema.graphql

# Add S3 Storage
amplify add storage
# Select: S3
# Bucket name: corjl-fabricon-uploads-{env}
# Public read access
# Authenticated users read/write

# Deploy
amplify push
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Fill in your AWS credentials (from Amplify output):
VITE_AWS_REGION=us-west-2
VITE_COGNITO_USER_POOL_ID=us-west-2_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
VITE_APPSYNC_ENDPOINT=https://xxxxx.appsync-api.us-west-2.amazonaws.com/graphql
VITE_S3_BUCKET=corjl-fabricon-uploads-dev
```

### 3. Start Development

```bash
# Start dev server (http://localhost:5173)
npm run dev

# In another terminal, run tests in watch mode
npm run test:ui
```

## Available Commands

### Development
```bash
npm run dev              # Start dev server
npm run preview          # Preview production build
npm run build            # Build for production
```

### Code Quality
```bash
npm run type-check       # TypeScript checking
npm run lint             # Lint and fix code
```

### Testing
```bash
npm run test             # Run unit tests (watch mode)
npm run test:ui          # Run tests with UI dashboard
npm run test:coverage    # Generate coverage report
npm run e2e              # Run E2E tests
npm run e2e:ui           # Run E2E tests with UI
```

### Mobile
```bash
npm run capacitor:sync              # Sync web code to native
npm run capacitor:open:ios          # Open iOS project in Xcode
npm run capacitor:open:android      # Open Android project in Studio
npm run capacitor:build:ios         # Build iOS app
npm run capacitor:build:android     # Build Android app
```

### AWS
```bash
npm run amplify:push                # Push changes to AWS
npm run amplify:pull                # Pull changes from AWS
npm run amplify:codegen             # Generate GraphQL types
```

## Project Structure

```
corjl-fabricon/
├── src/
│   ├── components/          # Shared UI components (BaseButton, BaseInput, etc)
│   ├── modules/
│   │   ├── editor/          # 2D/3D editor (Phase 2+)
│   │   ├── templates/       # Template library
│   │   ├── projects/        # Project management
│   │   └── mobile/          # Mobile features
│   ├── stores/              # Pinia state (auth, editor, etc)
│   ├── services/            # AWS API and S3
│   ├── views/               # Page components
│   ├── router/              # Vue Router config
│   ├── types/               # TypeScript definitions
│   └── main.ts              # App entry point
├── amplify/                 # AWS Amplify backend
│   └── backend/api/corjlapi/schema.graphql
├── tests/                   # Test files
├── vite.config.ts           # Build config
├── tailwind.config.js       # Styling
└── package.json             # Dependencies
```

## Authentication Flow

1. **Sign Up**:
   - User enters email, password, display name
   - Cognito sends verification code
   - User confirms code
   - Auto sign-in after confirmation

2. **Sign In**:
   - Email + password
   - Token stored in localStorage
   - Auto-redirect to /projects

3. **Session**:
   - Token refreshed automatically
   - Expires after set time (24hrs default)
   - Clear on sign out

## First App Actions

### Run the App
```bash
npm run dev
```
Open http://localhost:5173

### Try Authentication
1. Click "Sign up"
2. Create an account (verify with code - use AWS Console to check SES)
3. Sign in with credentials
4. See Projects and Templates pages

### Run Tests
```bash
npm run test:ui
```
- Auth store tests
- Component tests
- E2E auth flow tests

## Important Notes

- **TypeScript Strict Mode**: Enabled for safety
- **Auto-Save**: Planned for Phase 2 (debounced 2s)
- **Explicit Save**: Ctrl+S or Save button (Phase 2)
- **Mobile First**: Safe area utilities included
- **Performance**: Bundle size < 250KB (gzipped)

## Troubleshooting

### Port 5173 Already in Use
```bash
npm run dev -- --port 3000
```

### Type Errors
```bash
npm run type-check
```

### Lint Errors
```bash
npm run lint  # Auto-fixes most issues
```

### AWS Credentials Issues
- Verify `.env.local` has correct values
- Check AWS region matches your setup
- Ensure Cognito User Pool exists

## Next: Phase 2 - 2D Editor

Phase 2 will implement:
- Fabric.js canvas integration
- Object creation (text, shapes, images)
- Layer management
- Undo/redo history
- Export functionality

Estimated: 1-2 weeks

## Questions?

Check these files:
- `README.md` - Full documentation
- `PHASE1_VERIFICATION.md` - Verification checklist
- `MEMORY.md` - Development notes
