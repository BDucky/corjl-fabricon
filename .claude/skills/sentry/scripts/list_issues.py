#!/usr/bin/env python3
"""List Sentry issues/errors."""
import os
import sys
import json
import argparse
import ssl
import subprocess
import urllib.request
import urllib.parse

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

AUTH_TOKEN = get_auth_token()
ORG = "corjl"
PROJECT = "corjl-frontend"
BASE_URL = "https://sentry.io/api/0"

# SSL context for macOS
SSL_CONTEXT = ssl.create_default_context()
SSL_CONTEXT.check_hostname = False
SSL_CONTEXT.verify_mode = ssl.CERT_NONE


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


def main():
    parser = argparse.ArgumentParser(description="List Sentry issues")
    parser.add_argument("--query", default="is:unresolved", help="Search query")
    parser.add_argument("--limit", type=int, default=10, help="Number of issues")
    parser.add_argument("--sort", default="date", choices=["date", "new", "priority", "freq", "user"],
                        help="Sort order")
    args = parser.parse_args()

    if not AUTH_TOKEN:
        print(json.dumps({"error": "SENTRY_AUTH_TOKEN not set"}))
        sys.exit(1)

    result = api_request(f"projects/{ORG}/{PROJECT}/issues/", {
        "query": args.query,
        "limit": args.limit,
        "sort": args.sort
    })

    if isinstance(result, dict) and "error" in result:
        print(json.dumps(result))
        sys.exit(1)

    # Simplify output
    issues = []
    for issue in result:
        issues.append({
            "id": issue.get("id"),
            "shortId": issue.get("shortId"),
            "title": issue.get("title"),
            "culprit": issue.get("culprit"),
            "status": issue.get("status"),
            "level": issue.get("level"),
            "count": issue.get("count"),
            "userCount": issue.get("userCount"),
            "firstSeen": issue.get("firstSeen"),
            "lastSeen": issue.get("lastSeen"),
            "permalink": issue.get("permalink")
        })

    print(json.dumps(issues, indent=2))


if __name__ == "__main__":
    main()
