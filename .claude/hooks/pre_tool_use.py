#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

"""
Pre-tool-use hook for Corjl Webapp monorepo.

Protections:
- Block npm/yarn (must use pnpm)
- Block git force push to protected branches
- Block rm commands outside project
- Warn on dangerous rm patterns within project
- Protect GraphQL generated files
- Validate file locations for Vue components
"""

import json
import sys
import re
import os
from pathlib import Path

from utils.constants import ensure_session_log_dir


def get_project_root():
    """Get the project root directory."""
    hook_path = Path(__file__).resolve()
    return hook_path.parent.parent.parent


def resolve_path(path_str, cwd=None):
    """Resolve a path string to an absolute path."""
    if cwd is None:
        cwd = Path.cwd()

    path_str = os.path.expanduser(path_str)
    path_str = os.path.expandvars(path_str)

    path = Path(path_str)
    if not path.is_absolute():
        path = cwd / path

    try:
        return path.resolve()
    except (OSError, ValueError):
        return path


def is_path_within_project(path_str, project_root, cwd=None):
    """Check if a given path is within the project directory."""
    resolved = resolve_path(path_str, cwd)
    try:
        resolved.relative_to(project_root)
        return True
    except ValueError:
        return False


def extract_paths_from_rm_command(command):
    """Extract file/directory paths from an rm command."""
    parts = command.split()
    paths = []

    for part in parts:
        if part == 'rm':
            continue
        if part.startswith('-'):
            continue
        paths.append(part)

    return paths


def check_dangerous_rm_within_project(command):
    """
    Check for dangerous rm patterns within project.
    Returns (is_dangerous, message) tuple.
    """
    normalized = ' '.join(command.split())

    # Critical directories that should never be deleted entirely
    critical_patterns = [
        (r'\brm\s+.*-r.*\s+packages/?$', 'BLOCKED: Cannot delete entire packages/ directory'),
        (r'\brm\s+.*-r.*\s+apps/?$', 'BLOCKED: Cannot delete entire apps/ directory'),
        (r'\brm\s+.*-r.*\s+\.claude/?$', 'BLOCKED: Cannot delete .claude/ directory'),
        (r'\brm\s+.*-r.*\s+docs/?$', 'BLOCKED: Cannot delete entire docs/ directory'),
        (r'\brm\s+.*-r.*\s+infrastructure/?$', 'BLOCKED: Cannot delete infrastructure/ directory'),
    ]

    for pattern, message in critical_patterns:
        if re.search(pattern, normalized):
            return True, message

    # Warn patterns (not blocked, just logged)
    warn_patterns = [
        (r'\brm\s+.*-r.*\s+node_modules', 'WARNING: Deleting node_modules - will need pnpm install'),
        (r'\brm\s+.*-r.*\s+\.pnpm-store', 'WARNING: Deleting pnpm store'),
        (r'\brm\s+.*-r.*\s+dist/?', 'WARNING: Deleting build output'),
    ]

    for pattern, message in warn_patterns:
        if re.search(pattern, normalized):
            # Log warning but don't block
            print(message, file=sys.stderr)
            return False, None

    return False, None


def is_dangerous_rm_command(command, cwd=None):
    """Block rm commands that target paths outside the project."""
    normalized = ' '.join(command.split())
    if not re.search(r'\brm\s+', normalized):
        return False, None

    project_root = get_project_root()
    paths = extract_paths_from_rm_command(normalized)

    if cwd is None:
        cwd = Path.cwd()

    for path_str in paths:
        if not path_str.strip():
            continue

        if not is_path_within_project(path_str, project_root, cwd):
            return True, f'BLOCKED: rm command targets path outside project: {path_str}'

    # Check for dangerous patterns within project
    return check_dangerous_rm_within_project(command)


def check_package_manager(command):
    """
    Block npm/yarn commands - must use pnpm in this monorepo.
    Returns (is_blocked, message) tuple.
    """
    normalized = ' '.join(command.split())

    # Block npm commands (except npx which is ok for one-off tools)
    npm_patterns = [
        (r'^npm\s+install', 'BLOCKED: Use "pnpm install" instead of npm install'),
        (r'^npm\s+i\s', 'BLOCKED: Use "pnpm add" instead of npm i'),
        (r'^npm\s+add', 'BLOCKED: Use "pnpm add" instead of npm add'),
        (r'^npm\s+run', 'BLOCKED: Use "pnpm run" or "pnpm cli" instead of npm run'),
        (r'^npm\s+ci', 'BLOCKED: Use "pnpm install --frozen-lockfile" instead of npm ci'),
        (r'^npm\s+publish', 'BLOCKED: Publishing not allowed from local environment'),
    ]

    for pattern, message in npm_patterns:
        if re.search(pattern, normalized):
            return True, message

    # Block yarn commands
    yarn_patterns = [
        (r'^yarn\s+install', 'BLOCKED: Use "pnpm install" instead of yarn install'),
        (r'^yarn\s+add', 'BLOCKED: Use "pnpm add" instead of yarn add'),
        (r'^yarn\s+run', 'BLOCKED: Use "pnpm run" or "pnpm cli" instead of yarn run'),
        (r'^yarn\s*$', 'BLOCKED: Use "pnpm install" instead of yarn'),
        (r'^yarn\s+publish', 'BLOCKED: Publishing not allowed from local environment'),
    ]

    for pattern, message in yarn_patterns:
        if re.search(pattern, normalized):
            return True, message

    return False, None


def check_git_commands(command):
    """
    Block dangerous git commands.
    Returns (is_blocked, message) tuple.
    """
    normalized = ' '.join(command.split())

    # Block force push to protected branches
    force_push_patterns = [
        r'git\s+push\s+.*--force.*\s+(origin\s+)?(main|dev|stage|prod)',
        r'git\s+push\s+.*-f\s+.*\s+(origin\s+)?(main|dev|stage|prod)',
        r'git\s+push\s+(origin\s+)?(main|dev|stage|prod)\s+.*--force',
        r'git\s+push\s+(origin\s+)?(main|dev|stage|prod)\s+.*-f',
    ]

    for pattern in force_push_patterns:
        if re.search(pattern, normalized, re.IGNORECASE):
            return True, 'BLOCKED: Force push to protected branch (main/dev/stage/prod) is not allowed'

    # Block hard reset (warn only, don't block)
    if re.search(r'git\s+reset\s+--hard', normalized):
        print('WARNING: git reset --hard detected - uncommitted changes will be lost', file=sys.stderr)

    return False, None


def check_protected_files(tool_name, tool_input):
    """
    Protect generated and critical files from modification.
    Returns (is_blocked, message) tuple.
    """
    protected_patterns = [
        # GraphQL generated files
        (r'packages/plugins/graphql/_generated/', 'BLOCKED: Cannot modify generated GraphQL files. Run "pnpm cli graphql update-exports" instead'),
        # Lock files (should not be manually edited)
        (r'pnpm-lock\.yaml$', 'BLOCKED: Do not manually edit pnpm-lock.yaml. Run "pnpm install" to update'),
    ]

    # Check file paths in Write/Edit tools
    if tool_name in ['Write', 'Edit']:
        file_path = tool_input.get('file_path', '')
        for pattern, message in protected_patterns:
            if re.search(pattern, file_path):
                return True, message

    return False, None


def check_env_files(tool_name, tool_input):
    """
    Warn when modifying environment/credential files.
    Returns warning message or None.
    """
    sensitive_patterns = [
        r'\.env',
        r'credentials',
        r'secrets',
        r'\.pem$',
        r'\.key$',
    ]

    if tool_name in ['Write', 'Edit', 'Read']:
        file_path = tool_input.get('file_path', '')
        for pattern in sensitive_patterns:
            if re.search(pattern, file_path, re.IGNORECASE):
                print(f'WARNING: Accessing sensitive file: {file_path}', file=sys.stderr)
                return None  # Warn but don't block

    return None


def validate_vue_file_location(tool_name, tool_input):
    """
    Validate Vue component file locations.
    Returns warning message or None (advisory only).
    """
    if tool_name != 'Write':
        return None

    file_path = tool_input.get('file_path', '')
    content = tool_input.get('content', '')

    # Check if this is a Vue file
    if not file_path.endswith('.vue'):
        return None

    # Check if it's a component that might belong in packages/core
    # This is advisory - just logs a note
    if '/apps/' in file_path and '/components/' in file_path:
        # Check if component seems generic (no app-specific imports)
        if '@corjl/core' in content and 'apps/' not in content.replace(file_path, ''):
            print(f'NOTE: Consider if this component should be in packages/core/components/', file=sys.stderr)

    return None


def log_tool_use(session_id, input_data):
    """Log tool usage to session directory."""
    log_dir = ensure_session_log_dir(session_id)
    log_path = log_dir / 'pre_tool_use.json'

    if log_path.exists():
        with open(log_path, 'r') as f:
            try:
                log_data = json.load(f)
            except (json.JSONDecodeError, ValueError):
                log_data = []
    else:
        log_data = []

    log_data.append(input_data)

    with open(log_path, 'w') as f:
        json.dump(log_data, f, indent=2)


def main():
    try:
        input_data = json.load(sys.stdin)

        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        session_id = input_data.get('session_id', 'unknown')

        # Log all tool usage
        log_tool_use(session_id, input_data)

        # Check Bash commands
        if tool_name == 'Bash':
            command = tool_input.get('command', '')

            # Check package manager (npm/yarn blocked)
            is_blocked, message = check_package_manager(command)
            if is_blocked:
                print(message, file=sys.stderr)
                sys.exit(2)

            # Check git commands
            is_blocked, message = check_git_commands(command)
            if is_blocked:
                print(message, file=sys.stderr)
                sys.exit(2)

            # Check rm commands
            is_blocked, message = is_dangerous_rm_command(command)
            if is_blocked:
                print(message, file=sys.stderr)
                sys.exit(2)

        # Check protected files
        is_blocked, message = check_protected_files(tool_name, tool_input)
        if is_blocked:
            print(message, file=sys.stderr)
            sys.exit(2)

        # Warn on sensitive files (not blocked)
        check_env_files(tool_name, tool_input)

        # Validate Vue file locations (advisory)
        validate_vue_file_location(tool_name, tool_input)

        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception:
        sys.exit(0)


if __name__ == '__main__':
    main()
