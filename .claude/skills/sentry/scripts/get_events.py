#!/usr/bin/env python3
"""Get events for a Sentry issue."""
import os
import sys
import json
import argparse
import ssl
import subprocess
import urllib.request
import urllib.parse
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
    """Check if the issue_id is a short ID format (contains letters)."""
    if issue_id.isdigit():
        return False
    return bool(re.search(r'[A-Za-z]', issue_id))


def api_request(endpoint, params=None):
    url = f"{BASE_URL}/{endpoint}"
    if params:
        url += "?" + urllib.parse.urlencode(params)

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
    """Resolve a short ID to a numeric issue ID using the shortids lookup endpoint."""
    result = api_request(f"organizations/{ORG_SLUG}/shortids/{short_id}/")

    if isinstance(result, dict) and "error" not in result:
        return result.get("groupId")

    return None


def get_latest_event_with_stacktrace(issue_id: str) -> dict:
    """Fetch the latest event with full stacktrace details."""
    result = api_request(f"issues/{issue_id}/events/latest/", {})
    if isinstance(result, dict) and "error" not in result:
        return result
    return {}


def main():
    parser = argparse.ArgumentParser(description="Get events for a Sentry issue")
    parser.add_argument("issue_id", help="Issue ID (numeric or short like CORJL-FRONTEND-P16)")
    parser.add_argument("--limit", type=int, default=5, help="Number of events")
    parser.add_argument("--full", action="store_true", help="Include full stacktrace from latest event")
    args = parser.parse_args()

    if not AUTH_TOKEN:
        print(json.dumps({"error": "SENTRY_AUTH_TOKEN not set"}))
        sys.exit(1)

    issue_id = args.issue_id

    # Resolve short ID to numeric ID if needed
    if is_short_id(issue_id):
        numeric_id = resolve_short_id(issue_id)
        if not numeric_id:
            print(json.dumps({"error": f"Could not resolve short ID: {issue_id}"}))
            sys.exit(1)
        issue_id = numeric_id

    # If --full, get the latest event with full stacktrace
    if args.full:
        latest = get_latest_event_with_stacktrace(issue_id)
        if latest:
            print(json.dumps([latest], indent=2))
            return

    result = api_request(f"issues/{issue_id}/events/", {"limit": args.limit})

    if isinstance(result, dict) and "error" in result:
        print(json.dumps(result))
        sys.exit(1)

    # Simplify events but keep stacktrace data
    events = []
    for event in result:
        # Keep only exception entries with full data for stacktrace
        entries = []
        for entry in event.get("entries", []):
            if entry.get("type") == "exception":
                entries.append(entry)
            elif entry.get("type") == "breadcrumbs":
                # Keep last 5 breadcrumbs for context
                breadcrumbs = entry.get("data", {}).get("values", [])[-5:]
                entries.append({"type": "breadcrumbs", "data": {"values": breadcrumbs}})

        events.append({
            "eventID": event.get("eventID"),
            "id": event.get("id"),
            "message": event.get("message"),
            "title": event.get("title"),
            "platform": event.get("platform"),
            "dateCreated": event.get("dateCreated"),
            "tags": event.get("tags", [])[:10],  # Limit tags
            "context": event.get("context"),
            "entries": entries
        })

    print(json.dumps(events, indent=2))


if __name__ == "__main__":
    main()
