#!/usr/bin/env python3
"""
PreToolUse hook: Enforce token optimization rules at runtime.

Tracks per-session state and actively prevents waste patterns:
- Blocks duplicate file reads (same file, same session)
- Warns when tool call count gets high (approaching context limits)
- Blocks bash grep/find/cat when dedicated tools should be used
- Tracks sequential vs parallel call patterns

Reads from stdin: JSON with tool_name, tool_input, session_id
Prints to stdout: messages injected into Claude's context
Exit 0 = allow, Exit 2 = block
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime


STATE_DIR = Path.home() / '.claude' / 'session-state'


def get_state_file(session_id):
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    return STATE_DIR / f'{session_id}.json'


def load_state(session_id):
    state_file = get_state_file(session_id)
    if state_file.exists():
        try:
            with open(state_file) as f:
                return json.load(f)
        except (json.JSONDecodeError, Exception):
            pass
    return {
        'files_read': {},
        'tool_calls': 0,
        'edits': 0,
        'reads': 0,
        'searches': 0,
        'bash_calls': 0,
        'first_edit_at': None,
        'started': datetime.now().isoformat(),
    }


def save_state(session_id, state):
    state_file = get_state_file(session_id)
    with open(state_file, 'w') as f:
        json.dump(state, f, indent=2)


def check_duplicate_read(tool_input, state):
    """Block reading the exact same file path + offset that was already read."""
    file_path = tool_input.get('file_path', '')
    if not file_path:
        return None

    offset = tool_input.get('offset', 0)
    limit = tool_input.get('limit', 0)
    key = f"{file_path}:{offset}:{limit}"

    if key in state['files_read']:
        prev = state['files_read'][key]
        return (
            f"DUPLICATE READ BLOCKED: {file_path} was already read "
            f"(at {prev['time']}). Use a wider range if you need more context, "
            f"or reference the content from the earlier read."
        )

    # Track this read
    state['files_read'][key] = {
        'time': datetime.now().isoformat(),
        'offset': offset,
        'limit': limit,
    }

    # Also track by just file_path for warning on re-reads with different range
    path_key = f"path:{file_path}"
    if path_key in state['files_read']:
        prev = state['files_read'][path_key]
        count = prev.get('count', 1) + 1
        if count >= 3:
            print(
                f"WARNING: {file_path} has been read {count} times this session. "
                f"Consider reading a larger range in one call.",
                file=sys.stderr
            )
        state['files_read'][path_key]['count'] = count
    else:
        state['files_read'][path_key] = {
            'count': 1,
            'first_read': datetime.now().isoformat(),
        }

    return None


def check_bash_misuse(command):
    """Block bash commands that should use dedicated tools."""
    if not command:
        return None

    cmd = command.strip().split()[0] if command.strip() else ''

    blocked = {
        'cat': 'Use the Read tool instead of cat',
        'head': 'Use the Read tool with limit parameter instead of head',
        'tail': 'Use the Read tool with offset parameter instead of tail',
    }

    # Only block standalone usage, not piped commands
    if cmd in blocked and '|' not in command:
        return f"BLOCKED: {blocked[cmd]}"

    # Warn on grep/find but don't block (they might be piped)
    warned = {
        'grep': 'Consider using the Grep tool instead of bash grep',
        'rg': 'Consider using the Grep tool instead of rg',
        'find': 'Consider using the Glob tool instead of find',
    }

    if cmd in warned and '|' not in command:
        print(f"HINT: {warned[cmd]}", file=sys.stderr)

    return None


def check_tool_count(state):
    """Warn when tool calls are getting high."""
    count = state['tool_calls']

    if count == 40:
        print(
            "SESSION ALERT: 40 tool calls reached. Consider using /compact "
            "to free context, or wrapping exploration in a sub-agent.",
            file=sys.stderr
        )
    elif count == 70:
        print(
            "SESSION ALERT: 70 tool calls. Context window is likely filling up. "
            "Use /compact now or start a new session.",
            file=sys.stderr
        )

    return None


def check_no_limit_on_read(tool_input):
    """Warn when reading a file without a limit parameter."""
    file_path = tool_input.get('file_path', '')
    limit = tool_input.get('limit')
    offset = tool_input.get('offset')

    # Skip small/config files
    skip_extensions = {'.json', '.yaml', '.yml', '.toml', '.env', '.md', '.lock'}
    ext = Path(file_path).suffix.lower() if file_path else ''

    if limit is None and offset is None and ext not in skip_extensions:
        print(
            f"HINT: Consider using limit parameter when reading {Path(file_path).name} "
            f"to save context tokens.",
            file=sys.stderr
        )

    return None


def main():
    try:
        input_data = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, Exception):
        sys.exit(0)

    tool_name = input_data.get('tool_name', '')
    tool_input = input_data.get('tool_input', {})
    session_id = input_data.get('session_id', 'unknown')

    state = load_state(session_id)
    state['tool_calls'] += 1

    # Track tool types
    if tool_name == 'Read':
        state['reads'] += 1
    elif tool_name in ('Edit', 'Write'):
        state['edits'] += 1
        if state['first_edit_at'] is None:
            state['first_edit_at'] = state['tool_calls']
    elif tool_name in ('Grep', 'Glob'):
        state['searches'] += 1
    elif tool_name == 'Bash':
        state['bash_calls'] += 1

    block_message = None

    # Check duplicate reads
    if tool_name == 'Read':
        block_message = check_duplicate_read(tool_input, state)
        if not block_message:
            check_no_limit_on_read(tool_input)

    # Check bash misuse
    if tool_name == 'Bash':
        command = tool_input.get('command', '')
        block_message = check_bash_misuse(command)

    # Check tool count thresholds
    check_tool_count(state)

    # Save state
    save_state(session_id, state)

    if block_message:
        print(block_message, file=sys.stderr)
        sys.exit(2)

    sys.exit(0)


if __name__ == '__main__':
    main()
