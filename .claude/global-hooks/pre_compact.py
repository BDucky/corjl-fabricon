#!/usr/bin/env python3
"""
Pre-compact hook: Save working state before context compression.

When Claude Code auto-compacts (context window filling up), this hook
captures the current working state so it's not lost during compression.

It writes a summary file that Claude can reference after compaction to
remember what it was doing.
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def get_git_info():
    """Get current git branch and recent changes."""
    info = {}
    try:
        result = subprocess.run(
            ['git', 'branch', '--show-current'],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            info['branch'] = result.stdout.strip()

        result = subprocess.run(
            ['git', 'diff', '--name-only'],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            files = [f for f in result.stdout.strip().split('\n') if f]
            info['modified_files'] = files[:20]  # Cap at 20

        result = subprocess.run(
            ['git', 'diff', '--cached', '--name-only'],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            files = [f for f in result.stdout.strip().split('\n') if f]
            info['staged_files'] = files[:20]

    except Exception:
        pass
    return info


def main():
    try:
        input_data = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, Exception):
        sys.exit(0)

    session_id = input_data.get('session_id', 'unknown')
    cwd = input_data.get('cwd', os.getcwd())

    # Gather state
    git_info = get_git_info()

    state = {
        'timestamp': datetime.now().isoformat(),
        'session_id': session_id,
        'cwd': cwd,
        'git': git_info,
        'note': 'Context was auto-compacted. Review this file to remember working state.',
    }

    # Write to a session-specific file
    state_dir = Path.home() / '.claude' / 'compact-state'
    state_dir.mkdir(parents=True, exist_ok=True)

    state_file = state_dir / f'{session_id}.json'
    with open(state_file, 'w') as f:
        json.dump(state, f, indent=2)

    # Also write a human-readable summary to stdout (injected into context after compact)
    parts = []
    if git_info.get('branch'):
        parts.append(f"Branch: {git_info['branch']}")
    if git_info.get('modified_files'):
        parts.append(f"Modified files: {', '.join(git_info['modified_files'][:10])}")
    if git_info.get('staged_files'):
        parts.append(f"Staged files: {', '.join(git_info['staged_files'][:10])}")

    if parts:
        print('\n'.join(parts))

    sys.exit(0)


if __name__ == '__main__':
    main()
