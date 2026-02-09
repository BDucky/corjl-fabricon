#!/usr/bin/env python3
"""
Stop hook: Automatically save session state when Claude stops.

When a Claude session ends (task complete, user stops, etc.), this hook
captures the working state so the next session can pick up instantly.

Writes to ~/.claude/handoffs/<branch-name>.md
Reads session metrics from ~/.claude/session-state/<session_id>.json
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path


HANDOFF_DIR = Path.home() / '.claude' / 'handoffs'
STATE_DIR = Path.home() / '.claude' / 'session-state'


def run_git(*args):
    """Run a git command and return stdout or None."""
    try:
        result = subprocess.run(
            ['git'] + list(args),
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None


def get_session_stats(session_id):
    """Load session stats from token_guard state."""
    state_file = STATE_DIR / f'{session_id}.json'
    if state_file.exists():
        try:
            with open(state_file) as f:
                return json.load(f)
        except (json.JSONDecodeError, Exception):
            pass
    return None


def build_handoff():
    """Build handoff content from current git state."""
    branch = run_git('branch', '--show-current')
    if not branch:
        return None, None

    modified = run_git('diff', '--name-only')
    staged = run_git('diff', '--cached', '--name-only')
    recent_commits = run_git('log', '--oneline', '-5')

    modified_files = [f for f in (modified or '').split('\n') if f.strip()]
    staged_files = [f for f in (staged or '').split('\n') if f.strip()]

    lines = []
    lines.append(f"# Handoff: {branch}")
    lines.append(f"**Saved**: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    lines.append("")

    if staged_files:
        lines.append("## Staged files")
        for f in staged_files[:15]:
            lines.append(f"- `{f}`")
        lines.append("")

    if modified_files:
        lines.append("## Modified files (unstaged)")
        for f in modified_files[:15]:
            lines.append(f"- `{f}`")
        lines.append("")

    if recent_commits:
        lines.append("## Recent commits")
        lines.append("```")
        for line in recent_commits.split('\n')[:5]:
            lines.append(line)
        lines.append("```")
        lines.append("")

    # Only write if there's something meaningful
    if not modified_files and not staged_files:
        return branch, None

    return branch, '\n'.join(lines)


def main():
    try:
        input_data = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, Exception):
        sys.exit(0)

    session_id = input_data.get('session_id', 'unknown')

    # Build handoff
    branch, content = build_handoff()

    if not content:
        sys.exit(0)

    # Write handoff file
    HANDOFF_DIR.mkdir(parents=True, exist_ok=True)
    safe_branch = re.sub(r'[/\\]', '-', branch)
    handoff_file = HANDOFF_DIR / f'{safe_branch}.md'

    with open(handoff_file, 'w') as f:
        f.write(content)

    # Append session stats if available
    stats = get_session_stats(session_id)
    if stats:
        with open(handoff_file, 'a') as f:
            f.write("\n## Session stats\n")
            f.write(f"- Tool calls: {stats.get('tool_calls', '?')}\n")
            f.write(f"- File reads: {stats.get('reads', '?')}\n")
            f.write(f"- Edits: {stats.get('edits', '?')}\n")
            f.write(f"- Searches: {stats.get('searches', '?')}\n")
            f.write(f"- First edit at call #{stats.get('first_edit_at', '?')}\n")

    sys.exit(0)


if __name__ == '__main__':
    main()
