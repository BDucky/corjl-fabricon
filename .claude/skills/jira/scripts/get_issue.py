#!/usr/bin/env python3
"""Get Jira issue details."""
import os
import sys
import json
import argparse
import ssl
import subprocess
import urllib.request
import base64

def get_api_token():
    """Get API token from env or 1Password."""
    # Check environment variable first
    token = os.environ.get("JIRA_API_TOKEN")
    if token:
        return token

    # Fetch from 1Password
    try:
        result = subprocess.run(
            ["op", "read", "op://Personal/MCP/jira_api_token", "--account", "corjl.1password.com"],
            capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except Exception:
        return None

def get_user_email():
    """Get user email from env or 1Password."""
    # Check environment variable first
    email = os.environ.get("JIRA_USER_EMAIL")
    if email:
        return email

    # Fetch from 1Password
    try:
        result = subprocess.run(
            ["op", "read", "op://Personal/MCP/jira_user_email", "--account", "corjl.1password.com"],
            capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except Exception:
        return None

API_TOKEN = get_api_token()
USER_EMAIL = get_user_email()
SITE_URL = "https://corjl-software.atlassian.net"
CLOUD_ID = "81a2d86b-7b25-4741-b62f-24d42973a6df"

# Use Cloud API endpoint with scoped token
BASE_URL = f"https://api.atlassian.com/ex/jira/{CLOUD_ID}"

# SSL context for macOS
SSL_CONTEXT = ssl.create_default_context()
SSL_CONTEXT.check_hostname = False
SSL_CONTEXT.verify_mode = ssl.CERT_NONE


def api_request(endpoint):
    url = f"{BASE_URL}/rest/api/3/{endpoint}"

    # Use Basic Auth with email:token
    credentials = f"{USER_EMAIL}:{API_TOKEN}"
    basic_auth = base64.b64encode(credentials.encode()).decode()

    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Basic {basic_auth}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req, context=SSL_CONTEXT) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as e:
        return {"error": str(e), "status": e.code}


def get_comments(issue_key):
    """Fetch all comments for an issue."""
    result = api_request(f"issue/{issue_key}/comment")
    if "error" in result:
        return []

    comments = []
    for comment in result.get("comments", []):
        comments.append({
            "id": comment.get("id"),
            "author": comment.get("author", {}).get("displayName"),
            "body": comment.get("body"),  # ADF format
            "created": comment.get("created"),
            "updated": comment.get("updated")
        })
    return comments


def get_subtasks(fields):
    """Extract subtasks from issue fields."""
    subtasks = []
    for subtask in fields.get("subtasks", []):
        subtask_fields = subtask.get("fields", {})
        subtasks.append({
            "key": subtask.get("key"),
            "summary": subtask_fields.get("summary"),
            "status": subtask_fields.get("status", {}).get("name"),
            "issuetype": subtask_fields.get("issuetype", {}).get("name"),
            "priority": subtask_fields.get("priority", {}).get("name") if subtask_fields.get("priority") else None
        })
    return subtasks


def main():
    parser = argparse.ArgumentParser(description="Get Jira issue")
    parser.add_argument("issue_key", help="Issue key (e.g., COR-123)")
    parser.add_argument("--no-comments", action="store_true", help="Skip fetching comments")
    args = parser.parse_args()

    if not API_TOKEN:
        print(json.dumps({"error": "JIRA_API_TOKEN not set"}))
        sys.exit(1)

    if not USER_EMAIL:
        print(json.dumps({"error": "JIRA_USER_EMAIL not set"}))
        sys.exit(1)

    result = api_request(f"issue/{args.issue_key}")

    if "error" in result:
        print(json.dumps(result))
        sys.exit(1)

    # Extract relevant fields
    fields = result.get("fields", {})

    # Get subtasks
    subtasks = get_subtasks(fields)

    # Get comments (unless skipped)
    comments = [] if args.no_comments else get_comments(args.issue_key)

    # Get parent issue info if this is a subtask
    parent = None
    if fields.get("parent"):
        parent = {
            "key": fields.get("parent", {}).get("key"),
            "summary": fields.get("parent", {}).get("fields", {}).get("summary")
        }

    issue = {
        "key": result.get("key"),
        "id": result.get("id"),
        "summary": fields.get("summary"),
        "description": fields.get("description"),
        "status": fields.get("status", {}).get("name"),
        "statusCategory": fields.get("status", {}).get("statusCategory", {}).get("name"),
        "priority": fields.get("priority", {}).get("name") if fields.get("priority") else None,
        "issuetype": fields.get("issuetype", {}).get("name"),
        "assignee": fields.get("assignee", {}).get("displayName") if fields.get("assignee") else None,
        "reporter": fields.get("reporter", {}).get("displayName") if fields.get("reporter") else None,
        "project": {
            "key": fields.get("project", {}).get("key"),
            "name": fields.get("project", {}).get("name")
        },
        "labels": fields.get("labels", []),
        "created": fields.get("created"),
        "updated": fields.get("updated"),
        "url": f"{SITE_URL}/browse/{result.get('key')}",
        "parent": parent,
        "subtasks": subtasks,
        "comments": comments
    }

    print(json.dumps(issue, indent=2))


if __name__ == "__main__":
    main()
