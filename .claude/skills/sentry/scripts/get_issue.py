#!/usr/bin/env python3
"""Get Sentry issue details."""
import os
import sys
import json
import argparse
import ssl
import subprocess
import urllib.request
import re

def get_auth_token():
    """Get token from env or 1Password."""
    token = os.environ.get("SENTRY_AUTH_TOKEN")
    if token:
        return token

    # Fetch from 1Password
    try:
        result = subprocess.run(
            ["op", "read", "op://Personal/MCP/sentry_auth_token", "--account", "corjl.1password.com"],
            capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except Exception:
        return None

def get_org_slug():
    """Get organization slug from env or default."""
    return os.environ.get("SENTRY_ORG", "corjl")

AUTH_TOKEN = get_auth_token()
ORG_SLUG = get_org_slug()
BASE_URL = "https://sentry.io/api/0"

# SSL context for macOS
SSL_CONTEXT = ssl.create_default_context()
SSL_CONTEXT.check_hostname = False
SSL_CONTEXT.verify_mode = ssl.CERT_NONE


def is_short_id(issue_id: str) -> bool:
    """
    Check if the issue_id is a short ID format (e.g., CORJL-FRONTEND-P16).
    Short IDs contain letters and typically have format: PROJECT-SHORTID
    Numeric IDs are just numbers.
    """
    # If it's all digits, it's a numeric ID
    if issue_id.isdigit():
        return False
    # Short IDs contain letters and dashes (e.g., CORJL-FRONTEND-P16)
    return bool(re.search(r'[A-Za-z]', issue_id))


def api_request(endpoint):
    url = f"{BASE_URL}/{endpoint}"

    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {AUTH_TOKEN}",
            "Content-Type": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req, context=SSL_CONTEXT) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as e:
        return {"error": str(e), "status": e.code}


def resolve_short_id(short_id: str) -> str:
    """
    Resolve a short ID (e.g., CORJL-FRONTEND-P16) to a numeric issue ID.
    Uses the organization shortids lookup endpoint.
    """
    result = api_request(f"organizations/{ORG_SLUG}/shortids/{short_id}/")

    if isinstance(result, dict) and "error" not in result:
        # The endpoint returns groupId which is the numeric ID
        return result.get("groupId")

    return None


def main():
    parser = argparse.ArgumentParser(description="Get Sentry issue details")
    parser.add_argument("issue_id", help="Issue ID (numeric like 7097401016 or short like CORJL-FRONTEND-P16)")
    args = parser.parse_args()

    if not AUTH_TOKEN:
        print(json.dumps({"error": "SENTRY_AUTH_TOKEN not set"}))
        sys.exit(1)

    issue_id = args.issue_id

    # If it's a short ID, resolve it to numeric ID first
    if is_short_id(issue_id):
        numeric_id = resolve_short_id(issue_id)
        if not numeric_id:
            print(json.dumps({"error": f"Could not resolve short ID: {issue_id}"}))
            sys.exit(1)
        issue_id = numeric_id

    result = api_request(f"issues/{issue_id}/")

    if isinstance(result, dict) and "error" in result:
        print(json.dumps(result))
        sys.exit(1)

    # Extract relevant info
    issue = {
        "id": result.get("id"),
        "shortId": result.get("shortId"),
        "title": result.get("title"),
        "culprit": result.get("culprit"),
        "status": result.get("status"),
        "level": result.get("level"),
        "type": result.get("type"),
        "count": result.get("count"),
        "userCount": result.get("userCount"),
        "firstSeen": result.get("firstSeen"),
        "lastSeen": result.get("lastSeen"),
        "metadata": result.get("metadata"),
        "project": result.get("project"),
        "permalink": result.get("permalink"),
        "isPublic": result.get("isPublic"),
        "isSubscribed": result.get("isSubscribed")
    }

    print(json.dumps(issue, indent=2))


if __name__ == "__main__":
    main()
