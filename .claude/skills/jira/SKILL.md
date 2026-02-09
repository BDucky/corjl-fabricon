# Jira Skill

## Triggers

Automatically use this skill when user mentions (case-insensitive):
- `jira` - Any Jira-related request
- `cor-` - Jira issue key pattern (e.g., COR-4976, cor-123)
- `epic`, `story`, `task`, `bug` - When discussing Jira issue types
- `check issue`, `get issue`, `search issues` - Issue operations

**Note:** This skill supports both read and write operations (adding comments).

## Description
Manage tickets and tasks on Jira via REST API.

## Prerequisites

### Authentication: API Token with Scopes

This skill uses **Jira API Tokens with scopes** and **Basic Authentication** (email:token encoded in base64).

#### 1. Create API Token with Scopes

1. Visit: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token with scopes**
3. **Select the app**: Choose **Jira**
4. **Select scopes**: Choose ALL of the following scopes:

   **Required Scopes (Read):**
   - ✅ `read:jira-work` - Read issues, projects, comments, worklogs
   - ✅ `read:jira-user` - Read user information
   - ✅ `read:issue:jira` - Read issue data
   - ✅ `read:issue-details:jira` - Read issue fields, descriptions
   - ✅ `read:comment:jira` - Read comments
   - ✅ `read:project:jira` - Read project info
   - ✅ `read:user:jira` - Read user profiles
   - ✅ `read:jql:jira` - Execute JQL queries
   - ✅ `read:issue-type:jira` - Read issue types
   - ✅ `read:status:jira` - Read status info
   - ✅ `read:priority:jira` - Read priority info

   **Required Scopes (Write - for add_comment.py):**
   - ✅ `write:jira-work` - Write to issues, comments, worklogs (classic scope - required for Basic Auth)


5. Name your token (e.g., "Claude Jira Skill" or "MCP")
6. Copy the token (you won't see it again!)

#### 2. Required Permissions

Your Atlassian account needs these **Project Permissions** for the scripts to work:

**For all scripts:**
- ✅ **Browse Projects** - View project and issues
- ✅ **Browse Issues** - View issue details

**For get_issue.py (with comments):**
- ✅ **View Comments** - Read issue comments

**For list_my_issues.py and search_issues.py:**
- ✅ **Browse Projects** - Required for JQL queries
- ✅ **Browse Issues** - Required for issue data

**For add_comment.py:**
- ✅ **Add Comments** - Required to add comments to issues
- ✅ **Browse Projects** - Required to access the issue

#### 3. API Scopes Used

These scripts use the following Jira REST API v3 endpoints:

**get_issue.py:**
- `GET /rest/api/3/issue/{issueKey}` - Get issue details
  - Requires: `read:issue:jira`, `read:issue-details:jira`
- `GET /rest/api/3/issue/{issueKey}/comment` - Get comments
  - Requires: `read:comment:jira`

**list_my_issues.py:**
- `GET /rest/api/3/search/jql` - Search with JQL
  - Requires: `read:issue:jira`, `read:jql:jira`

**search_issues.py:**
- `GET /rest/api/3/search/jql` - Search with JQL
  - Requires: `read:issue:jira`, `read:jql:jira`

**add_comment.py:**
- `POST /rest/api/3/issue/{issueKey}/comment` - Add comment to issue
  - Requires: `write:jira-work` (classic scope for Basic Auth)

**Granular Scopes (for reference):**
- `read:issue:jira` - Read issue data
- `read:issue-details:jira` - Read issue fields, descriptions
- `read:comment:jira` - Read comments
- `read:project:jira` - Read project info
- `read:user:jira` - Read user profiles (assignee, reporter)
- `read:issue-type:jira` - Read issue types
- `read:status:jira` - Read status info
- `read:priority:jira` - Read priority info
- `read:jql:jira` - Execute JQL queries

#### 4. Store Credentials

**Option A: Environment Variables**
```bash
# Set both token and email
export JIRA_API_TOKEN="your_scoped_api_token_here"
export JIRA_USER_EMAIL="your.email@company.com"
```

**Option B: 1Password (Recommended)**

Store your credentials in 1Password at:
- `op://Personal/MCP/jira_api_token` - Your scoped API token (NOT base64 encoded)
- `op://Personal/MCP/jira_user_email` - Your Atlassian email

The scripts will automatically:
1. Check for environment variables first (`JIRA_API_TOKEN` and `JIRA_USER_EMAIL`)
2. If not found, fetch from 1Password automatically
3. Combine email:token and encode in base64 for Basic Auth

### API Endpoints
- Cloud ID: `81a2d86b-7b25-4741-b62f-24d42973a6df`
- API Base URL: `https://api.atlassian.com/ex/jira/{CLOUD_ID}`
- Site URL: `https://corjl-software.atlassian.net` (for issue links)

### How Authentication Works

The scripts use **Basic Authentication** with your email and scoped token:
1. Combine `email:token` → `user@example.com:ATATT3xFfGF0...`
2. Encode in base64 → `dXNlckBleGFtcGxlLmNvbTpBVEFUVDN4RmZHRjBweC4uLg==`
3. Send as header: `Authorization: Basic {base64_string}`

## Available Scripts

### get_issue.py
Get issue details including subtasks and comments.

```bash
python scripts/get_issue.py COR-123              # With comments
python scripts/get_issue.py COR-123 --no-comments  # Skip comments (faster)
```

**Output includes:**
- Basic fields: key, summary, description, status, priority, etc.
- **subtasks**: Array of subtask objects with key, summary, status
- **comments**: Array of comment objects with author, body (ADF), created date
- **parent**: Parent issue reference (if this is a subtask)

### list_my_issues.py
List issues assigned to you.

```bash
python scripts/list_my_issues.py
python scripts/list_my_issues.py --status "In Progress"
python scripts/list_my_issues.py --project COR
python scripts/list_my_issues.py --limit 20
```

### search_issues.py
Search issues with JQL.

```bash
python scripts/search_issues.py "project = COR AND status = 'To Do'"
python scripts/search_issues.py "assignee = currentUser() AND sprint in openSprints()"
```

### add_comment.py
Add a comment to a Jira issue. Supports markdown formatting.

```bash
# Inline comment
python scripts/add_comment.py COR-123 --comment "This is my comment"

# Comment from file
python scripts/add_comment.py COR-123 --file comment.md

# Comment from stdin (useful for piping)
echo "My comment" | python scripts/add_comment.py COR-123 --stdin
```

**Supported Markdown:**
- Bold text: `**text**` or `__text__`
- Code blocks: ``` code ```
- Bullet lists: `- item` (supports nested/indented bullets)
- Horizontal rules: `---`
- Plain paragraphs
- User mentions: `@DisplayName` or `@"Display Name With Spaces"`

**User Mentions:**
- Use `@john.doe` for simple usernames (no spaces)
- Use `@"John Doe"` for display names with spaces
- The script will search Jira for the user and convert to a proper mention
- If user is not found, it will be displayed as plain text

**Output on success:**
```json
{
  "success": true,
  "comment_id": "12345",
  "comment_url": "https://corjl-software.atlassian.net/browse/COR-123?focusedCommentId=12345",
  "issue_url": "https://corjl-software.atlassian.net/browse/COR-123",
  "author": "Your Name",
  "created": "2024-01-15T10:30:00.000+0000"
}
```

## Output Format
JSON for easy parsing.

## Troubleshooting

### "JIRA_API_TOKEN not set" or "JIRA_USER_EMAIL not set"
- Check environment variables are set: `JIRA_API_TOKEN` and `JIRA_USER_EMAIL`
- Or verify 1Password items exist:
  - `op://Personal/MCP/jira_api_token`
  - `op://Personal/MCP/jira_user_email`
- Verify you have exported the variables in your shell

### 401 Unauthorized
- Scoped API token is invalid or expired
- Token doesn't have required scopes (check you selected ALL scopes listed above)
- Email address doesn't match the account that created the token
- Create a new scoped API token at https://id.atlassian.com/manage-profile/security/api-tokens

### 401 "scope does not match" (for add_comment.py)
- **This is a common issue!** Granular scopes like `write:comment:jira` don't work with Basic Auth
- You need the **classic scope** `write:jira-work` instead
- Create a new token and select `write:jira-work` under the "Classic" scopes section
- The classic scope covers: issues, comments, worklogs, and attachments

### 403 Forbidden
- Token doesn't have required scopes (check scopes list above)
- User account doesn't have required project permissions
- Ask Jira admin to grant "Browse Projects" and "Browse Issues" permissions

### 404 Not Found
- Issue doesn't exist, OR
- User doesn't have "Browse Projects" permission for that project
- Token scopes don't include access to that resource
- Check you can view the issue in browser first

### Empty Results ([] or no projects)
- Token is authenticating but doesn't have the right scopes
- Make sure you created "API token with scopes" (not regular API token)
- Verify ALL required scopes are selected when creating the token
- The account must have permissions to the projects/issues you're trying to access

## Security Notes

- Scoped API tokens have limited access based on selected scopes
- Store tokens securely in environment variables
- Never commit tokens to version control
- Rotate tokens periodically
- Revoke tokens when no longer needed at https://id.atlassian.com/manage-profile/security/api-tokens

## When to Use MCP Instead
- Bulk operations
- Complex JQL queries with pagination
- Workflow automations
