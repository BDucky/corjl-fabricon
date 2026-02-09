# Project Tools Overview

## Principle: Skills-based Approach

Instead of loading MCP servers by default (which consumes tokens every message), use file system scripts when needed.

## Available Skills

| Skill | Location | Description | Auth Type |
|-------|----------|-------------|-----------|
| Linear | `.claude/skills/linear/` | Project management via `linear-agent` CLI | Personal API Key |
| Sentry | `.claude/skills/sentry/` | Error monitoring - list/resolve/assign errors | User Auth Token |
| Jira | `.claude/skills/jira/` | Ticket management (READ-ONLY) | Scoped API Token |
| Context7 | `.claude/skills/context7/` | Up-to-date library documentation | API Key |

## Authentication

### Quick Reference

| Service | Token URL | 1Password Path | Env Variable |
|---------|-----------|----------------|--------------|
| Linear | [linear.app/settings/api](https://linear.app/settings/api) | `op://Personal/MCP/linear_api_key` | `LINEAR_API_KEY` |
| Sentry | [sentry.io/settings/account/api/auth-tokens/](https://sentry.io/settings/account/api/auth-tokens/) | `op://Personal/MCP/sentry_auth_token` + `sentry_user_email` | `SENTRY_AUTH_TOKEN` + `SENTRY_DEFAULT_USER` |
| Jira | [id.atlassian.com/.../api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens) | `op://Personal/MCP/jira_api_token` + `jira_user_email` | `JIRA_API_TOKEN` + `JIRA_USER_EMAIL` |
| Context7 | Contact provider | `op://Personal/MCP/context7_api_key` | `CONTEXT7_API_KEY` |

### Priority Order

Scripts check credentials in this order:
1. **1Password CLI** (Recommended) - auto-fetch from `op://Personal/MCP/...`
2. **Environment variables** - fallback if 1Password unavailable

### Token Types Explained

#### Linear - Personal API Key
- Full access to your Linear account
- No granular permissions (unlike Sentry)
- Requires `linear-agent` CLI (Node.js 18+)
- See: `.claude/skills/linear/SKILL.md`

#### Sentry - User Auth Token + User Email
- **Must use User Auth Token** (not Organization Token)
- **User email required** for auto-assignment (newer tokens don't support `/users/me/`)
- Script looks up user ID from org members using email → `user:<id>` format
- Required scopes: `project:read`, `issue:read`, `issue:write`, `event:read`, `org:read`, `member:read`
- See: `.claude/skills/sentry/SKILL.md`

#### Jira - Scoped API Token with Basic Auth
- Uses "API token with scopes" (not regular API token)
- Requires both token AND email for Basic Auth
- READ-ONLY: No write operations supported
- Required scopes: `read:jira-work`, `read:jira-user`, `read:issue:jira`, etc.
- See: `.claude/skills/jira/SKILL.md`

## Special Requirements

### Linear CLI
```bash
# Requires Node.js 18+
git clone https://github.com/CorjlSoftware/linear-cli.git
cd linear-cli && npm install && npm run build && npm link
linear-agent --version
```

## Usage

1. Read `SKILL.md` in each folder for available scripts and detailed setup
2. Run scripts with required arguments
3. Output is always JSON for easy parsing
4. Scripts include SSL context bypass for macOS compatibility

## ADWS Integration

The `.ai/adws/` workflow system uses these skills:
- **Sentry**: Auto-assigns issues when starting work (`assign_issue`)
- **Linear**: Creates tracking issues for workflow progress
- **Jira**: Fetches issue details for spec generation

## When to Use Full MCP

- Real-time/streaming data
- Complex multi-step workflows requiring MCP-specific capabilities
- Debugging API connection issues
