---
description: "E2E Test Runner"
---

# E2E Test Runner

Execute end-to-end (E2E) tests using Playwright browser automation via MCP Server. Tests the full application flow from user perspective.

## Variables

- adw_id: $1 if provided, otherwise generate a random 8 character hex string
- agent_name: $2 if provided, otherwise use 'e2e_test_runner'
- test_scope: $3 if provided (auth|designer|enduser|all), otherwise 'all'

## Prerequisites

### Starting E2E Mode

Before running E2E tests, the application must be running in E2E mode:

```bash
# Start E2E mode (builds all apps, then serves via proxy)
pnpm cli dev:e2e
```

This will:
1. Build all apps (auth, designer, enduser, demo)
2. Start the proxy server on `http://localhost:3000`

### Port Configuration

The proxy server runs on port 3000 by default. For custom ports (e.g., in worktrees):

**Option 1: Using `.ports.env` file**

If a `.ports.env` file exists in the project root, read the `PROXY_PORT` variable:

```bash
# .ports.env example (auto-generated for worktrees)
PROXY_PORT=3001
VUE_CLI_SERVER_AUTH=http://localhost:9191
VUE_CLI_SERVER_APP=http://localhost:9192
VUE_CLI_SERVER_ENDUSER=http://localhost:9193
VUE_CLI_SERVER_DEMO=http://localhost:9194
```

**Option 2: Using PORT environment variable**

```bash
PORT=3001 pnpm cli dev:e2e
```

### Determining Application URL

Use this logic to determine the application URL:

```
IF .ports.env exists AND contains PROXY_PORT:
  application_url = http://localhost:${PROXY_PORT}
ELSE IF PORT environment variable is set:
  application_url = http://localhost:${PORT}
ELSE:
  application_url = http://localhost:3000
```

## Instructions

### 1. Verify E2E Mode is Running

Before running tests, check if the application is running:

```bash
# Check health endpoint
curl http://localhost:3000/health
```

If not running, start E2E mode:

```bash
pnpm cli dev:e2e
```

### 2. Authentication Setup

**IMPORTANT**: The application requires authentication. Before running UI tests:
1. Ask the user for test credentials if not available in environment
2. Or use test account credentials from `.env.test` if available

### 3. Execute E2E Tests

Run Playwright tests based on test_scope:

**For specific app:**
```bash
pnpm exec playwright test apps/{test_scope}/__e2e__/ --reporter=json
```

**For all apps:**
```bash
pnpm exec playwright test --reporter=json
```

**With custom base URL (for worktrees):**
```bash
# Read port from .ports.env if present
source .ports.env 2>/dev/null
BASE_URL="http://localhost:${PROXY_PORT:-3000}" pnpm exec playwright test --reporter=json
```

### 4. Capture Screenshots

Save screenshots to: `.ai/agents/{adw_id}/{agent_name}/screenshots/`

- Take screenshots at key interaction points
- Capture any error states
- Use descriptive filenames: `01_login.png`, `02_dashboard.png`, etc.

### 5. Parse Results

If tests produce JSON output, parse it for detailed results including:
- Test name and status
- Duration
- Error messages
- Screenshot paths

## App Routes Reference

| App | Route | Description |
|-----|-------|-------------|
| Auth | `/:lang/auth` (e.g., `/en/auth`) | Authentication & login |
| Designer | `/:lang/app` (e.g., `/en/app`) | Main design tool |
| Enduser | `/:lang/c` (e.g., `/en/c`) | Customer-facing app |
| Demo | `/d` | SSR demo application |
| Health | `/health` | Health check endpoint |

**Default Base URL**: `http://localhost:3000` (via local-dev-proxy)

## Report

Return ONLY valid JSON (no markdown, no explanation):

### Output Format

```json
[
  {
    "test_name": "string - descriptive test name",
    "passed": boolean,
    "execution_command": "string - command to reproduce",
    "test_purpose": "string - what this test validates",
    "duration_ms": number,
    "screenshots": ["array of screenshot paths"],
    "error": "optional string - error message if failed"
  }
]
```

### Example Output

```json
[
  {
    "test_name": "auth_login_flow",
    "passed": true,
    "execution_command": "pnpm exec playwright test apps/auth/__e2e__/login.spec.ts",
    "test_purpose": "Validates user can login with valid credentials",
    "duration_ms": 2340,
    "screenshots": [".ai/agents/abc123/e2e_test_runner/screenshots/01_login_page.png"]
  },
  {
    "test_name": "designer_canvas_load",
    "passed": false,
    "execution_command": "pnpm exec playwright test apps/designer/__e2e__/canvas.spec.ts",
    "test_purpose": "Validates canvas loads correctly with all tools",
    "duration_ms": 5120,
    "screenshots": [".ai/agents/abc123/e2e_test_runner/screenshots/02_canvas_error.png"],
    "error": "Timeout waiting for canvas element to be visible"
  }
]
```

## Notes

- E2E tests require the full application stack running via `pnpm cli dev:e2e`
- Tests may be slower due to real browser interactions
- Screenshots help debug visual issues
- Consider running in headed mode for debugging: `--headed`
- For worktrees, always check `.ports.env` for custom port configuration
- The local-dev-proxy serves all apps through a single port, enabling shared authentication
