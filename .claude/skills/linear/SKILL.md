# Linear Skill

## Triggers

Automatically use this skill when user mentions (case-insensitive):
- `linear` - Any Linear-related request
- `linear-agent` - CLI tool commands
- `linear issue`, `linear ticket` - Issue operations
- `delegated issues`, `my issues` - Issue queries

## Description
Manage issues and projects on Linear via `linear-agent` CLI tool.

## Prerequisites

### 1. Install linear-agent CLI

```bash
# Clone the repository
git clone https://github.com/CorjlSoftware/linear-cli.git
cd linear-cli

# Install dependencies
npm install

# Build the project
npm run build

# Make available globally
npm link

# Verify installation
linear-agent --version
```

**Requirements:** Node.js 18+ (for native fetch support)

### 2. Authentication: Personal API Key

This skill uses **Linear Personal API Keys** for authentication.

#### Create Personal API Key

1. Log into Linear at https://linear.app
2. Click your profile avatar (bottom left) → **Settings**
3. Click **API** in the left sidebar, or go directly to: https://linear.app/settings/api
4. Click **Create key**
5. Give it a descriptive name (e.g., "Claude Linear Skill" or "CLI Tool")
6. Copy the generated key immediately (you won't see it again!)

> **Note:** Linear Personal API Keys provide full access to your account data. Unlike Sentry, there are no granular permission scopes.

#### Store Credentials

**API Key Priority Order** (checked in this order):
1. 1Password CLI (Recommended)
2. `LINEAR_API_KEY` environment variable
3. `.linear-agent-config.json` config file

**Option A: 1Password CLI (Recommended)**
```bash
# Store your Linear API key in 1Password at:
# op://Personal/MCP/linear_api_key

# The tool will automatically read from this location
op read op://Personal/MCP/linear_api_key
```

**Option B: Environment Variable**
```bash
# Add to your shell config (~/.bashrc, ~/.zshrc, etc.)
export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Option C: Config Command**
```bash
# Set the API key persistently (stored in ~/.linear-agent-config.json)
linear-agent config --api-key lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optionally set a default team
linear-agent config --default-team "Your Team Name"

# View current configuration
linear-agent config --show
```

### API Endpoints
- GraphQL API: `https://api.linear.app/graphql`
- Rate Limit: 1,500 requests/hour (authenticated), 60/hour (unauthenticated)

### How Authentication Works

The CLI uses **Bearer Token Authentication**:
```
Authorization: lin_api_xxxxx
```

## Troubleshooting

### "command not found: linear-agent"
- Ensure you've run `npm link` in the linear-cli directory
- Try using full path: `node /path/to/linear-cli/dist/cli.js`

### "Authentication failed" or "Invalid API key"
- Verify your API key starts with `lin_api_`
- Check that the key hasn't been revoked in Linear settings
- Ensure no extra spaces when copying the key

### "Cannot find module" errors
- Run `npm install` in the linear-cli directory
- Run `npm run build` to compile TypeScript

### Rate Limit Exceeded
- Wait for rate limit window to reset (1 hour)
- Authenticated requests: 1,500/hour

## Security Notes

- Store API keys securely (1Password recommended)
- Never commit API keys to version control
- Rotate keys periodically
- Revoke unused keys at https://linear.app/settings/api

## Important: Use --help
Always use `--help` for the most up-to-date command options:
```bash
linear-agent --help           # All available commands
linear-agent <command> --help # Specific command details
```

## Common Commands

### List Teams
```bash
linear-agent teams
```

### List Issues
```bash
linear-agent issues                              # All issues
linear-agent issues --state "In Progress"        # By state
linear-agent issues --query "bug" --limit 10     # Search with query
linear-agent my-issues                           # My assigned issues
linear-agent delegated-issues                    # Issues delegated to agents
```

### Get Issue Details
```bash
linear-agent show COR-123                        # Basic info
linear-agent show COR-123 --children --comments  # With sub-tasks and comments
```

### Create Issue
```bash
linear-agent create -t "Bug title" --team Engineering
linear-agent create -t "Task" --team Engineering --description "Details..."
linear-agent create -t "Bug" --team Engineering --labels bug ui --priority 2
linear-agent create -t "Visual bug" --description "See screenshot" --image ./bug.png --team Design
```

### Update Issue
```bash
linear-agent update COR-123 --state "Done"
linear-agent update COR-123 --priority 2
linear-agent update COR-123 --state "In Review" --image proof-of-fix.png
```

### Add Comment
```bash
linear-agent comment COR-123 -m "Working on this"
linear-agent comment COR-123 -m "Fixed the issue" --image ./screenshot.png
linear-agent comment COR-123 -m "Before and after" --images before.png after.png
```

### Workflow Commands
```bash
linear-agent start COR-123 --agent react-frontend-engineer  # Start work
linear-agent complete COR-123 --commit abc123 --message "feat: Add feature"  # Complete task
```

## Image Attachments
Supports PNG, JPG, JPEG, GIF, SVG, WebP (max 25MB):
```bash
--image ./single.png           # Single image
--images a.png b.png c.png     # Multiple images
```

**Note**: Quote paths with spaces: `--image "/path/with spaces/file.png"`

## Output Format
JSON for easy parsing. Use `--json` flag when available.

## Agent Identifiers
| Agent | Short ID | Emoji |
|-------|----------|-------|
| React Frontend Engineer | react | ⚛️ |
| UI/UX Designer | ui | 🎨 |
| Code Quality Reviewer | review | 🔍 |
| QA Engineer | qa | ✅ |
| PM Coordinator | pm | 📊 |
