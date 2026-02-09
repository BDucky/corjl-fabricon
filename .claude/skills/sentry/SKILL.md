# Sentry Skill

## Triggers

Automatically use this skill when user mentions (case-insensitive):
- `sentry` - Any Sentry-related request
- `corjl-frontend-` - Sentry short ID pattern (e.g., CORJL-FRONTEND-ABC)
- `error tracking`, `error monitoring` - Error investigation
- `unresolved errors`, `resolve error` - Error management
- `stack trace`, `error events` - Debugging

## Description
Monitor and manage errors from Sentry via REST API.

## Prerequisites

### Authentication: User Auth Token

This skill uses **Sentry User Auth Tokens (Personal Tokens)** for API authentication.

#### 1. Create User Auth Token

1. Visit: https://sentry.io/settings/account/api/auth-tokens/
2. Click **Create New Token**
3. **Select scopes**: Choose the following scopes:

   **Required Scopes:**
   - ✅ `project:read` - Read project information
   - ✅ `issue:read` - Read issue/error data
   - ✅ `issue:write` - Update issue status (resolve, ignore, assign)
   - ✅ `event:read` - Read error events and stack traces
   - ✅ `org:read` - Read organization info
   - ✅ `member:read` - Read organization members (for user ID lookup)

4. Name your token (e.g., "Claude Sentry Skill" or "MCP")
5. Copy the token (you won't see it again!)

#### Token Types Reference

| Type | URL | Use Case |
|------|-----|----------|
| **User Auth Token** ✓ | `sentry.io/settings/account/api/auth-tokens/` | API access with user context |
| Organization Token | `{org}.sentry.io/settings/auth-tokens/` | CI/CLI tasks only |

#### 2. Store Credentials

**Required: Auth Token**

| Method | Location |
|--------|----------|
| Environment Variable | `SENTRY_AUTH_TOKEN` |
| 1Password (Recommended) | `op://Personal/MCP/sentry_auth_token` |

**Required for Auto-Assignment: User Email**

> **Note:** Sentry's newer User Auth Tokens don't support the `/users/me/` endpoint. To enable auto-assignment, you must configure your email. The script will look up your user ID from organization members.

| Method | Location |
|--------|----------|
| Environment Variable | `SENTRY_DEFAULT_USER` |
| 1Password (Recommended) | `op://Personal/MCP/sentry_user_email` |

**Example Setup:**
```bash
# Auth token
export SENTRY_AUTH_TOKEN="sntryu_your_token_here"

# User email for auto-assignment
export SENTRY_DEFAULT_USER="your.email@example.com"
```

The scripts will automatically:
1. Check for environment variables first
2. If not found, fetch from 1Password automatically
3. Look up user ID from org members using email → `user:<id>` format

### API Endpoints
- Organization: `corjl`
- Project: `corjl-frontend`
- API Base URL: `https://sentry.io/api/0/`

### How Authentication Works

The scripts use **Bearer Token Authentication**:
1. Token is sent as header: `Authorization: Bearer {token}`

## Troubleshooting

### "SENTRY_AUTH_TOKEN not set"
- Check environment variable is set: `SENTRY_AUTH_TOKEN`
- Or verify 1Password item exists: `op://Personal/MCP/sentry_auth_token`
- Verify you have exported the variable in your shell

### "Could not determine assignee"
- Set `SENTRY_DEFAULT_USER` env var with your email
- Or add `sentry_user_email` to 1Password at `op://Personal/MCP/sentry_user_email`
- Or use `--user` flag: `python assign_issue.py <id> --user your@email.com`

### 401 Unauthorized
- Auth token is invalid or expired
- Create a new User Auth Token at https://sentry.io/settings/account/api/auth-tokens/

### 403 Forbidden on `/users/me/`
- This is expected with newer User Auth Tokens
- The script will fallback to `SENTRY_DEFAULT_USER` or `sentry_user_email`
- No action needed if you've configured your email

### 403 Forbidden (other endpoints)
- Token doesn't have required scopes
- User account doesn't have access to the project
- Ask Sentry admin to grant access

### 404 Not Found
- Issue/project doesn't exist
- User doesn't have access to that resource

## Security Notes

- Store tokens securely in environment variables
- Never commit tokens to version control
- Rotate tokens periodically
- Revoke tokens when no longer needed at https://sentry.io/settings/account/api/auth-tokens/

## Available Scripts

### list_issues.py
List recent issues/errors.

```bash
python scripts/list_issues.py                     # Recent errors
python scripts/list_issues.py --query "is:unresolved"
python scripts/list_issues.py --limit 20
```

### get_issue.py
Get issue details.

```bash
python scripts/get_issue.py <issue_id>
```

### get_events.py
Get events for an issue.

```bash
python scripts/get_events.py <issue_id>
python scripts/get_events.py <issue_id> --limit 5
```

### assign_issue.py
Assign an issue to current user.

```bash
python scripts/assign_issue.py <issue_id>              # Assign to me
python scripts/assign_issue.py <issue_id> --unassign   # Unassign issue
python scripts/assign_issue.py <issue_id> --user email@example.com  # Assign to specific user
```

**Use case:** Run this when you start working on a Sentry issue to claim ownership.

**How it works:**
1. Tries `/users/me/` API (may fail with newer tokens)
2. Falls back to `SENTRY_DEFAULT_USER` env var or `sentry_user_email` from 1Password
3. Looks up user ID from org members: `email` → `user:<id>`
4. Assigns issue using reliable `user:<id>` format

### resolve_issue.py
Resolve an issue. **Auto-assigns to current user** when resolving.

```bash
python scripts/resolve_issue.py <issue_id>              # Resolve + auto-assign
python scripts/resolve_issue.py <issue_id> --no-assign  # Resolve without assign
python scripts/resolve_issue.py <issue_id> --status ignored
```

**Note:** When status is `resolved`, the script automatically assigns using the same mechanism as `assign_issue.py`.

### list_projects.py
List projects in org.

```bash
python scripts/list_projects.py
```

## Output Format
JSON for easy parsing.

## When to Use MCP Instead
- Real-time alerting
- Complex queries with multiple filters
- Bulk operations
