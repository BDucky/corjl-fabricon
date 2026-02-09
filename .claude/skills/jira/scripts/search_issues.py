#!/usr/bin/env python3
"""Search Jira issues with JQL."""
import os
import sys
import json
import argparse
import ssl
import subprocess
import urllib.request
import urllib.parse
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


def api_request(endpoint, params=None):
    url = f"{BASE_URL}/rest/api/3/{endpoint}"
    if params:
        url += "?" + urllib.parse.urlencode(params)

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


def main():
    parser = argparse.ArgumentParser(description="Search Jira issues")
    parser.add_argument("jql", help="JQL query")
    parser.add_argument("--limit", type=int, default=10, help="Max results")
    args = parser.parse_args()

    if not API_TOKEN:
        print(json.dumps({"error": "JIRA_API_TOKEN not set"}))
        sys.exit(1)

    if not USER_EMAIL:
        print(json.dumps({"error": "JIRA_USER_EMAIL not set"}))
        sys.exit(1)

    result = api_request("search/jql", {
        "jql": args.jql,
        "maxResults": args.limit,
        "fields": "summary,status,priority,issuetype,project,assignee,created,updated"
    })

    if "error" in result:
        print(json.dumps(result))
        sys.exit(1)

    # Extract issues
    output = {
        "total": result.get("total"),
        "issues": []
    }

    for item in result.get("issues", []):
        fields = item.get("fields", {})
        output["issues"].append({
            "key": item.get("key"),
            "summary": fields.get("summary"),
            "status": fields.get("status", {}).get("name"),
            "priority": fields.get("priority", {}).get("name") if fields.get("priority") else None,
            "type": fields.get("issuetype", {}).get("name"),
            "project": fields.get("project", {}).get("key"),
            "assignee": fields.get("assignee", {}).get("displayName") if fields.get("assignee") else None,
            "updated": fields.get("updated"),
            "url": f"{SITE_URL}/browse/{item.get('key')}"
        })

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
