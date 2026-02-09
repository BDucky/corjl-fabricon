#!/usr/bin/env python3
"""Add a comment to a Jira issue."""
import os
import sys
import json
import argparse
import ssl
import subprocess
import urllib.request
import urllib.parse
import base64
import re

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

# Cache for user lookups to avoid repeated API calls
USER_CACHE = {}


def api_request(endpoint):
    """Make a GET request to the Jira API."""
    url = f"{BASE_URL}/rest/api/3/{endpoint}"
    
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


def search_user(display_name):
    """Search for a Jira user by display name and return their account ID.
    
    Args:
        display_name: The display name to search for (e.g., "John Doe")
        
    Returns:
        dict with 'accountId' and 'displayName' if found, None otherwise
    """
    # Check cache first
    cache_key = display_name.lower().strip()
    if cache_key in USER_CACHE:
        return USER_CACHE[cache_key]
    
    # Search for user
    encoded_query = urllib.parse.quote(display_name)
    result = api_request(f"user/search?query={encoded_query}&maxResults=5")
    
    if "error" in result or not result:
        USER_CACHE[cache_key] = None
        return None
    
    # Try to find exact match first
    for user in result:
        if user.get("displayName", "").lower() == display_name.lower():
            user_info = {
                "accountId": user.get("accountId"),
                "displayName": user.get("displayName")
            }
            USER_CACHE[cache_key] = user_info
            return user_info
    
    # If no exact match, return first result if available
    if result:
        user_info = {
            "accountId": result[0].get("accountId"),
            "displayName": result[0].get("displayName")
        }
        USER_CACHE[cache_key] = user_info
        return user_info
    
    USER_CACHE[cache_key] = None
    return None


def markdown_to_adf(markdown_text):
    """Convert simple markdown to Atlassian Document Format (ADF).
    
    Supports:
    - Bold text: **text** or __text__
    - Code blocks: ```code```
    - Bullet lists: - item
    - Horizontal rules: ---
    - Plain paragraphs
    - User mentions: @DisplayName or @"Display Name With Spaces"
    """
    doc = {
        "version": 1,
        "type": "doc",
        "content": []
    }
    
    lines = markdown_text.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Skip empty lines
        if not line.strip():
            i += 1
            continue
        
        # Horizontal rule
        if line.strip() == '---':
            doc["content"].append({"type": "rule"})
            i += 1
            continue
        
        # Code block
        if line.strip().startswith('```'):
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith('```'):
                code_lines.append(lines[i])
                i += 1
            i += 1  # Skip closing ```
            
            code_text = '\n'.join(code_lines)
            doc["content"].append({
                "type": "codeBlock",
                "attrs": {"language": "text"},
                "content": [{"type": "text", "text": code_text}]
            })
            continue
        
        # Bullet list (supports nested/indented bullets)
        if line.lstrip().startswith('- '):
            list_items = []
            base_indent = len(line) - len(line.lstrip())
            
            while i < len(lines) and lines[i].lstrip().startswith('- '):
                current_line = lines[i]
                current_indent = len(current_line) - len(current_line.lstrip())
                
                # If this is a top-level item (same indent as base)
                if current_indent == base_indent:
                    item_text = current_line.strip()[2:]  # Remove "- "
                    item_content = parse_inline_markdown(item_text)
                    
                    # Check if next lines are nested bullets
                    nested_items = []
                    j = i + 1
                    while j < len(lines):
                        next_line = lines[j]
                        if not next_line.strip():
                            j += 1
                            continue
                        if not next_line.lstrip().startswith('- '):
                            break
                        next_indent = len(next_line) - len(next_line.lstrip())
                        if next_indent <= base_indent:
                            break
                        # This is a nested item
                        nested_text = next_line.strip()[2:]
                        nested_content = parse_inline_markdown(nested_text)
                        nested_items.append({
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": nested_content
                            }]
                        })
                        j += 1
                    
                    # Build list item content
                    list_item_content = [{
                        "type": "paragraph",
                        "content": item_content
                    }]
                    
                    # Add nested list if there are nested items
                    if nested_items:
                        list_item_content.append({
                            "type": "bulletList",
                            "content": nested_items
                        })
                        i = j  # Skip past nested items
                    else:
                        i += 1
                    
                    list_items.append({
                        "type": "listItem",
                        "content": list_item_content
                    })
                else:
                    # Skip nested items here as they're handled above
                    i += 1
            
            doc["content"].append({
                "type": "bulletList",
                "content": list_items
            })
            continue
        
        # Regular paragraph
        paragraph_content = parse_inline_markdown(line)
        if paragraph_content:
            doc["content"].append({
                "type": "paragraph",
                "content": paragraph_content
            })
        i += 1
    
    return doc


def parse_inline_markdown(text):
    """Parse inline markdown (bold, mentions) and return ADF content array.
    
    Supports:
    - Bold: **text** or __text__
    - Mentions: @DisplayName or @"Display Name" (for names with spaces)
    """
    content = []
    
    # Combined pattern for bold and mentions
    # Bold: **text** or __text__
    # Mentions: @"Name With Spaces" or @SingleName
    pattern = r'(\*\*(.+?)\*\*|__(.+?)__|@"([^"]+)"|@(\w+(?:\.\w+)*))'
    
    last_end = 0
    
    for match in re.finditer(pattern, text):
        # Add text before the match
        if match.start() > last_end:
            plain_text = text[last_end:match.start()]
            if plain_text:
                content.append({"type": "text", "text": plain_text})
        
        full_match = match.group(0)
        
        # Check if it's bold
        if full_match.startswith('**') or full_match.startswith('__'):
            bold_text = match.group(2) or match.group(3)
            content.append({
                "type": "text",
                "text": bold_text,
                "marks": [{"type": "strong"}]
            })
        # Check if it's a mention
        elif full_match.startswith('@'):
            # Extract display name (with or without quotes)
            display_name = match.group(4) or match.group(5)
            
            # Look up user
            user = search_user(display_name)
            
            if user and user.get("accountId"):
                # Add as proper Jira mention
                content.append({
                    "type": "mention",
                    "attrs": {
                        "id": user["accountId"],
                        "text": f"@{user['displayName']}",
                        "accessLevel": ""
                    }
                })
            else:
                # User not found, keep as plain text
                content.append({"type": "text", "text": full_match})
        
        last_end = match.end()
    
    # Add remaining text
    if last_end < len(text):
        remaining = text[last_end:]
        if remaining:
            content.append({"type": "text", "text": remaining})
    
    # If no matches, return the whole text as plain
    if not content and text:
        content.append({"type": "text", "text": text})
    
    return content


def add_comment(issue_key, comment_body):
    """Add a comment to a Jira issue."""
    url = f"{BASE_URL}/rest/api/3/issue/{issue_key}/comment"
    
    # Use Basic Auth with email:token
    credentials = f"{USER_EMAIL}:{API_TOKEN}"
    basic_auth = base64.b64encode(credentials.encode()).decode()
    
    # Convert markdown to ADF
    adf_body = markdown_to_adf(comment_body)
    
    data = json.dumps({"body": adf_body}).encode('utf-8')
    
    req = urllib.request.Request(
        url,
        data=data,
        method='POST',
        headers={
            "Authorization": f"Basic {basic_auth}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    )
    
    try:
        with urllib.request.urlopen(req, context=SSL_CONTEXT) as response:
            result = json.loads(response.read())
            return {
                "success": True,
                "comment_id": result.get("id"),
                "comment_url": f"{SITE_URL}/browse/{issue_key}?focusedCommentId={result.get('id')}",
                "issue_url": f"{SITE_URL}/browse/{issue_key}",
                "author": result.get("author", {}).get("displayName"),
                "created": result.get("created")
            }
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else str(e)
        return {
            "success": False,
            "error": str(e),
            "status": e.code,
            "details": error_body
        }


def main():
    parser = argparse.ArgumentParser(description="Add a comment to a Jira issue")
    parser.add_argument("issue_key", help="Issue key (e.g., COR-123)")
    parser.add_argument("--comment", "-c", help="Comment text (markdown supported)")
    parser.add_argument("--file", "-f", help="Read comment from file")
    parser.add_argument("--stdin", action="store_true", help="Read comment from stdin")
    args = parser.parse_args()

    if not API_TOKEN:
        print(json.dumps({"success": False, "error": "JIRA_API_TOKEN not set"}))
        sys.exit(1)

    if not USER_EMAIL:
        print(json.dumps({"success": False, "error": "JIRA_USER_EMAIL not set"}))
        sys.exit(1)

    # Get comment text from various sources
    comment_text = None
    
    if args.stdin:
        comment_text = sys.stdin.read()
    elif args.file:
        try:
            with open(args.file, 'r') as f:
                comment_text = f.read()
        except Exception as e:
            print(json.dumps({"success": False, "error": f"Failed to read file: {e}"}))
            sys.exit(1)
    elif args.comment:
        comment_text = args.comment
    else:
        print(json.dumps({"success": False, "error": "No comment provided. Use --comment, --file, or --stdin"}))
        sys.exit(1)

    if not comment_text.strip():
        print(json.dumps({"success": False, "error": "Comment cannot be empty"}))
        sys.exit(1)

    result = add_comment(args.issue_key, comment_text)
    print(json.dumps(result, indent=2))
    
    if not result.get("success"):
        sys.exit(1)


if __name__ == "__main__":
    main()
