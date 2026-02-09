#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "python-dotenv",
# ]
# ///

"""
User prompt submit hook for Corjl Webapp monorepo.

Features:
- Log all user prompts
- Inject context about current git branch
- Add reminders about Vue 3 conventions
- Detect affected apps from prompt
"""

import argparse
import json
import os
import sys
import subprocess
import re
from pathlib import Path
from datetime import datetime
from utils.constants import ensure_session_log_dir

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def get_git_branch():
    """Get current git branch name."""
    try:
        result = subprocess.run(
            ['git', 'branch', '--show-current'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None


def get_git_status_summary():
    """Get a brief git status summary."""
    try:
        result = subprocess.run(
            ['git', 'status', '--porcelain'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            if lines and lines[0]:
                modified = len([l for l in lines if l.startswith(' M') or l.startswith('M ')])
                added = len([l for l in lines if l.startswith('A ') or l.startswith('??')])
                deleted = len([l for l in lines if l.startswith(' D') or l.startswith('D ')])
                return {'modified': modified, 'added': added, 'deleted': deleted, 'total': len(lines)}
    except Exception:
        pass
    return None


def detect_affected_apps(prompt):
    """
    Detect which apps might be affected based on prompt content.
    Returns list of app names.
    """
    apps = []
    prompt_lower = prompt.lower()

    app_keywords = {
        'auth': ['auth', 'login', 'signup', 'sign up', 'register', 'cognito', 'authentication'],
        'designer': ['designer', 'design tool', 'editor', 'canvas', 'fabric', 'toolbar'],
        'enduser': ['enduser', 'end user', 'customer', 'storefront', 'shop'],
        'demo': ['demo', 'ssr', 'server side'],
    }

    for app, keywords in app_keywords.items():
        for keyword in keywords:
            if keyword in prompt_lower:
                if app not in apps:
                    apps.append(app)
                break

    return apps


def detect_affected_packages(prompt):
    """
    Detect which packages might be affected based on prompt content.
    Returns list of package names.
    """
    packages = []
    prompt_lower = prompt.lower()

    package_keywords = {
        'core': ['component', 'composable', 'store', 'pinia', 'shared'],
        'editor': ['editor', 'canvas', 'fabric', 'layer', 'selection'],
        'extensions': ['extension', 'plugin system'],
        'plugins': ['graphql', 'locale', 'i18n', 'translation', 'vite plugin'],
    }

    for pkg, keywords in package_keywords.items():
        for keyword in keywords:
            if keyword in prompt_lower:
                if pkg not in packages:
                    packages.append(pkg)
                break

    return packages


def generate_context_message(branch, git_status, affected_apps, affected_packages):
    """
    Generate context message to inject into the prompt.
    Printed to stdout - will be added to the prompt.
    """
    context_parts = []

    # Branch context
    if branch:
        branch_type = None
        if branch.startswith('feature/'):
            branch_type = 'feature'
        elif branch.startswith('fix/'):
            branch_type = 'bug fix'
        elif branch.startswith('chore/'):
            branch_type = 'chore'
        elif branch.startswith('refactor/'):
            branch_type = 'refactoring'

        if branch_type:
            context_parts.append(f"Working on {branch_type} branch: {branch}")

    # Affected apps/packages
    if affected_apps:
        context_parts.append(f"Likely affected apps: {', '.join(affected_apps)}")
    if affected_packages:
        context_parts.append(f"Likely affected packages: {', '.join(affected_packages)}")

    # Git status
    if git_status and git_status.get('total', 0) > 0:
        context_parts.append(f"Uncommitted changes: {git_status['modified']} modified, {git_status['added']} added")

    return '\n'.join(context_parts) if context_parts else None


def log_user_prompt(session_id, input_data, context_data=None):
    """Log user prompt to session directory."""
    log_dir = ensure_session_log_dir(session_id)
    log_file = log_dir / 'user_prompt_submit.json'

    if log_file.exists():
        with open(log_file, 'r') as f:
            try:
                log_data = json.load(f)
            except (json.JSONDecodeError, ValueError):
                log_data = []
    else:
        log_data = []

    # Add context data if available
    if context_data:
        input_data['_context'] = context_data

    log_data.append(input_data)

    with open(log_file, 'w') as f:
        json.dump(log_data, f, indent=2)


def validate_prompt(prompt):
    """
    Validate the user prompt for security or policy violations.
    Returns tuple (is_valid, reason).
    """
    blocked_patterns = [
        # Add any patterns you want to block
        # Example: ('delete all', 'Broad deletion command detected'),
    ]

    prompt_lower = prompt.lower()

    for pattern, reason in blocked_patterns:
        if pattern.lower() in prompt_lower:
            return False, reason

    return True, None


def main():
    try:
        parser = argparse.ArgumentParser()
        parser.add_argument('--validate', action='store_true',
                          help='Enable prompt validation')
        parser.add_argument('--log-only', action='store_true',
                          help='Only log prompts, no context injection')
        parser.add_argument('--inject-context', action='store_true',
                          help='Inject context information into prompt')
        args = parser.parse_args()

        input_data = json.loads(sys.stdin.read())

        session_id = input_data.get('session_id', 'unknown')
        prompt = input_data.get('prompt', '')

        # Gather context
        context_data = {
            'timestamp': datetime.now().isoformat(),
            'branch': get_git_branch(),
            'git_status': get_git_status_summary(),
            'affected_apps': detect_affected_apps(prompt),
            'affected_packages': detect_affected_packages(prompt),
        }

        # Log the user prompt with context
        log_user_prompt(session_id, input_data, context_data)

        # Validate prompt if requested
        if args.validate and not args.log_only:
            is_valid, reason = validate_prompt(prompt)
            if not is_valid:
                print(f"Prompt blocked: {reason}", file=sys.stderr)
                sys.exit(2)

        # Inject context if requested (print to stdout)
        if args.inject_context and not args.log_only:
            context_message = generate_context_message(
                context_data['branch'],
                context_data['git_status'],
                context_data['affected_apps'],
                context_data['affected_packages']
            )
            if context_message:
                # This will be appended to the prompt
                print(f"\n<user-prompt-submit-hook>\n{context_message}\n</user-prompt-submit-hook>")

        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception:
        sys.exit(0)


if __name__ == '__main__':
    main()
