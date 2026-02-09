#!/usr/bin/env python3
"""Assign a Sentry issue to current user (me)."""
import os
import sys
import json
import argparse
import ssl
import subprocess
import urllib.request

# Default organization for member lookup
DEFAULT_ORG = "corjl"

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


def get_default_user():
    """Get default user from env or 1Password."""
    user = os.environ.get("SENTRY_DEFAULT_USER")
    if user:
        return user

    # Fetch from 1Password
    try:
        result = subprocess.run(
            ["op", "read", "op://Personal/MCP/sentry_user_email", "--account", "corjl.1password.com"],
            capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except Exception:
        return None


AUTH_TOKEN = get_auth_token()
BASE_URL = "https://sentry.io/api/0"

# SSL context for macOS
SSL_CONTEXT = ssl.create_default_context()
SSL_CONTEXT.check_hostname = False
SSL_CONTEXT.verify_mode = ssl.CERT_NONE


def api_request(endpoint, data=None, method="GET"):
    url = f"{BASE_URL}/{endpoint}"

    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode() if data else None,
        headers={
            "Authorization": f"Bearer {AUTH_TOKEN}",
            "Content-Type": "application/json"
        },
        method=method
    )

    try:
        with urllib.request.urlopen(req, context=SSL_CONTEXT) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as e:
        return {"error": str(e), "status": e.code}


def get_current_user():
    """Get current authenticated user from Sentry."""
    result = api_request("users/me/")
    if isinstance(result, dict) and "error" not in result:
        return {
            "username": result.get("username"),
            "email": result.get("email"),
            "name": result.get("name"),
            "id": result.get("id")
        }
    return None


def lookup_user_id_by_email(email: str) -> str | None:
    """
    Look up Sentry user ID from organization members by email.

    Args:
        email: User email to look up

    Returns:
        User ID in format "user:<id>" or None if not found
    """
    result = api_request(f"organizations/{DEFAULT_ORG}/members/")
    if isinstance(result, list):
        for member in result:
            user = member.get("user", {}) or {}
            member_email = member.get("email") or user.get("email", "")
            if member_email.lower() == email.lower():
                user_id = user.get("id")
                if user_id:
                    return f"user:{user_id}"
    return None


def get_assignee():
    """
    Get assignee for issue assignment.

    Priority:
    1. /users/me/ API endpoint (returns user:<id> format)
    2. SENTRY_DEFAULT_USER env var (email -> lookup user ID)
    3. 1Password: op://Personal/MCP/sentry_default_user (email -> lookup user ID)

    Returns:
        Tuple of (assignee_identifier, source_description)
    """
    # Try /users/me/ first
    current_user = get_current_user()
    if current_user:
        user_id = current_user.get("id")
        if user_id:
            return f"user:{user_id}", "API /users/me/"
        # Fallback to email if no ID
        assignee = current_user.get("username") or current_user.get("email")
        return assignee, "API /users/me/"

    # Fallback to configured default user
    default_user = get_default_user()
    if default_user:
        # If it's an email, try to look up the user ID for more reliable assignment
        if "@" in default_user:
            user_id = lookup_user_id_by_email(default_user)
            if user_id:
                return user_id, f"config ({default_user} -> {user_id})"
        # Return as-is (could be email, username, or user:id format)
        return default_user, "config (SENTRY_DEFAULT_USER or 1Password)"

    return None, None


def main():
    parser = argparse.ArgumentParser(description="Assign Sentry issue to me (current user)")
    parser.add_argument("issue_id", help="Issue ID (e.g., CORJL-FRONTEND-ABC or numeric ID)")
    parser.add_argument("--unassign", action="store_true", help="Unassign issue")
    parser.add_argument("--user", "-u", help="Specify user email to assign (overrides auto-detection)")
    args = parser.parse_args()

    if not AUTH_TOKEN:
        print(json.dumps({"error": "SENTRY_AUTH_TOKEN not set"}))
        sys.exit(1)

    # Determine assignee
    if args.unassign:
        assignee = ""  # Empty string to unassign
    elif args.user:
        # Use explicitly provided user
        assignee = args.user
    else:
        # Auto-detect assignee
        assignee, source = get_assignee()
        if not assignee:
            print(json.dumps({
                "error": "Could not determine assignee. Options: "
                         "(1) Set SENTRY_DEFAULT_USER env var, "
                         "(2) Add sentry_user_email to 1Password at op://Personal/MCP/sentry_user_email, "
                         "(3) Use --user flag"
            }))
            sys.exit(1)

    # Update issue
    payload = {"assignedTo": assignee}
    result = api_request(f"issues/{args.issue_id}/", payload, "PUT")

    if isinstance(result, dict) and "error" in result:
        print(json.dumps(result))
        sys.exit(1)

    # Build output
    output = {
        "success": True,
        "id": result.get("id"),
        "shortId": result.get("shortId"),
        "title": result.get("title"),
        "status": result.get("status")
    }

    assigned_to = result.get("assignedTo")
    if assigned_to:
        output["assignedTo"] = assigned_to.get("name") or assigned_to.get("email")
    elif args.unassign:
        output["assignedTo"] = None
        output["message"] = "Issue unassigned"

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
