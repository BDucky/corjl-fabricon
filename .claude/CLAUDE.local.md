# Fabricon Project-Specific Rules

## Project Overview

This is the **Fabricon** next-generation design platform project. Build phases are documented in `docs/IMPLEMENTATION_PLAN.md`.

## Critical Files

### Configuration
- `package.json` - Dependencies and scripts
- `pnpm-lock.yaml` - Lock file
- `vite.config.ts` - Build configuration
- `vitest.config.ts` - Test configuration
- `amplify/backend/api/corjlapi/schema.graphql` - GraphQL schema

### Source Structure
- `src/components/` - Vue components
- `src/modules/` - Feature modules (editor, templates, projects, mobile)
- `src/stores/` - Pinia stores
- `src/views/` - Page components
- `src/types/` - TypeScript definitions
- `tests/unit/` - Unit tests

### Documentation
- `docs/IMPLEMENTATION_PLAN.md` - **Full 13-phase plan (reference for requirements)**
- `docs/AWS_SETUP_GUIDE.md` - AWS configuration steps
- `docs/SETUP_COMPLETE.md` - Phase 1 completion
- `README.md` - Project overview
- `QUICKSTART.md` - Quick reference

## Development Workflow

### Before Starting Each Phase

1. **Review the plan**: Read `docs/IMPLEMENTATION_PLAN.md` for current phase requirements
2. **Check tests**: Run `pnpm run test` to verify all tests pass
3. **Verify build**: Run `pnpm run build` to confirm production build succeeds
4. **Check linting**: Run `pnpm run lint` for code quality

### During Development

1. **Write tests first**: Create test files for new features
2. **Implement features**: Write code to make tests pass
3. **Run validation**: Use `/validate` command for autonomous check loop
4. **Commit regularly**: Small, focused commits with clear messages

### Code Quality Standards

- TypeScript strict mode (no `any` types unless necessary)
- ESLint configured for Vue 3 + TypeScript
- All public functions have types
- All components have proper prop types
- Tests for all business logic

## Key Commands

### Project-Specific
```bash
pnpm run dev              # Start dev server (http://localhost:5173)
pnpm run type-check       # TypeScript checking
pnpm run lint             # Linting
pnpm run build            # Production build
pnpm run test             # Run tests
pnpm run test:ui          # Tests with dashboard
pnpm run test:coverage    # Coverage report

amplify init              # Initialize AWS (if needed)
amplify push              # Deploy changes to AWS
```

### CLI Commands (Shortcuts)
```bash
/explore <question>       # Explore codebase with sub-agent (saves context)
/validate                 # Run autonomous lint/typecheck/test loop
/scope <description>      # Assess task size and workflow
/diagnose <test-file>     # Diagnose test failures
/context <canvas|editor|auth|all>  # Pre-load files by area
/quick-fix <description>  # Lightweight fix without full SDLC
/handoff                  # Save session state for next session
/resume                   # Restore context from previous session
/session-audit            # Analyze session efficiency
```

## Phase-Specific Rules

### Phase 1: Foundation ✅ COMPLETE
- Authentication module fully implemented
- Base components created
- Testing infrastructure in place
- AWS schema designed

### Phase 2: 2D Editor Core 🚀 STARTING
**Requirements**: Implement Fabric.js integration
- `src/modules/editor/components/FabricCanvas.vue`
- `src/modules/editor/composables/useFabricCanvas.ts`
- `src/modules/editor/stores/objectManagerStore.ts`
- `src/modules/editor/stores/canvasHistoryStore.ts`
- Object types: text, shapes, images
- Layer management
- Undo/redo
- Export: PNG, PDF, SVG

**Success Criteria**:
- All unit tests passing
- 60fps canvas performance
- All object operations working
- Undo/redo tested

### Phase 3+: Template System, 3D Viewer, Mobile, etc.
See `docs/IMPLEMENTATION_PLAN.md` for details

## Important Notes

### AWS Credentials
- `.env.local` stores AWS configuration (NOT in git)
- Never commit credentials to repository
- Use environment variables in all AWS calls

### Performance Targets
- Canvas: 60fps rendering
- Bundle: < 250KB gzipped
- Load time: < 3 seconds

### State Management
All UI state goes through Pinia stores:
- `authStore` - User authentication
- `editorStore` - Editor view state (Phase 2)
- `objectManagerStore` - Design objects (Phase 2)
- `canvasHistoryStore` - Undo/redo (Phase 2)

### Testing
- Unit tests in `tests/unit/`
- E2E tests in `tests/e2e/` (Playwright)
- Run tests before each commit
- Aim for > 80% coverage

## Development Tips

1. **Use `/explore` for large searches** - Protects main context window
2. **Use `/validate` for test/fix loops** - Autonomous validation
3. **Read the plan** - Reference requirements before implementing
4. **Small commits** - One feature per commit
5. **Tests first** - Write tests before implementation
6. **Check memory** - Session memory in `~/.claude/projects/`

## File Locations

### Important AWS Files
- `amplify/backend/api/corjlapi/schema.graphql` - GraphQL schema
- `amplify/backend/auth/` - Auth configuration
- `.env.example` - Environment template
- `.env.local` - Local AWS credentials (NOT in git)

### Main App Files
- `src/main.ts` - Entry point
- `src/App.vue` - Root component
- `src/router/index.ts` - Router configuration
- `src/stores/auth.ts` - Auth store

### Type Definitions
- `src/types/index.ts` - All TypeScript interfaces

## Links

- Implementation Plan: `docs/IMPLEMENTATION_PLAN.md`
- AWS Setup: `docs/AWS_SETUP_GUIDE.md`
- Architecture: Read top of `IMPLEMENTATION_PLAN.md`
