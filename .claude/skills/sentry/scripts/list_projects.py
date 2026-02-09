#!/usr/bin/env python3
"""List Sentry projects in organization."""
import os
import sys
import json
import ssl
import subprocess
import urllib.request

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
BASE_URL = "https://sentry.io/api/0"

# SSL context for macOS
SSL_CONTEXT = ssl.create_default_context()
SSL_CONTEXT.check_hostname = False
SSL_CONTEXT.verify_mode = ssl.CERT_NONE


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


def main():
    if not AUTH_TOKEN:
        print(json.dumps({"error": "SENTRY_AUTH_TOKEN not set"}))
        sys.exit(1)

    result = api_request(f"organizations/{ORG}/projects/")

    if isinstance(result, dict) and "error" in result:
        print(json.dumps(result))
        sys.exit(1)

    projects = []
    for project in result:
        projects.append({
            "id": project.get("id"),
            "slug": project.get("slug"),
            "name": project.get("name"),
            "platform": project.get("platform"),
            "status": project.get("status"),
            "dateCreated": project.get("dateCreated")
        })

    print(json.dumps(projects, indent=2))


if __name__ == "__main__":
    main()
