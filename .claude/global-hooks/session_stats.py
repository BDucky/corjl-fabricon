#!/usr/bin/env python3
"""
PostToolUse hook: Track session metrics and inject efficiency hints.

After each tool use, updates metrics and provides real-time feedback:
- Warns after exploration spirals (too many reads/searches before first edit)
- Detects when the agent is stuck in a search loop
- Tracks test run count and warns on excessive test/fix cycles
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path


STATE_DIR = Path.home() / '.claude' / 'session-state'


def load_state(session_id):
    state_file = STATE_DIR / f'{session_id}.json'
    if state_file.exists():
        try:
            with open(state_file) as f:
                return json.load(f)
        except (json.JSONDecodeError, Exception):
            pass
    return None


def save_state(session_id, state):
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    state_file = STATE_DIR / f'{session_id}.json'
    with open(state_file, 'w') as f:
        json.dump(state, f, indent=2)


def check_exploration_spiral(state):
    """Warn if too many reads/searches happened before first edit."""
    first_edit = state.get('first_edit_at')

    if first_edit is not None:
        return  # Already made an edit, no spiral concern

    reads = state.get('reads', 0)
    searches = state.get('searches', 0)
    exploration = reads + searches

    if exploration == 15:
        print(
            "EFFICIENCY HINT: 15 exploration calls without an edit. "
            "If you're still researching, consider using a sub-agent "
            "(Task tool with subagent_type='Explore') to protect the main context.",
            file=sys.stderr
        )
    elif exploration == 25:
        print(
            "EFFICIENCY WARNING: 25 exploration calls without an edit. "
            "This exploration should be in a sub-agent. The main context "
            "is filling with search results that won't be needed later.",
            file=sys.stderr
        )


def check_test_cycle(state, tool_name, tool_input):
    """Track test runs and warn on excessive test/fix cycles."""
    if tool_name != 'Bash':
        return

    command = tool_input.get('command', '')
    if not re.search(r'pnpm\s+(test|vitest)', command):
        return

    test_runs = state.get('test_runs', 0) + 1
    state['test_runs'] = test_runs

    if test_runs == 4:
        print(
            "TEST CYCLE ALERT: 4 test runs this session. If tests keep failing, "
            "stop and diagnose the root cause before making more edits. "
            "Common Vue test issues: missing flushPromises(), ref .value access, "
            "mock signature mismatch.",
            file=sys.stderr
        )
    elif test_runs == 6:
        print(
            "TEST CYCLE WARNING: 6 test runs. Consider asking the user for help "
            "or reading the test file more carefully before the next edit.",
            file=sys.stderr
        )


def check_search_loop(state, tool_name):
    """Detect repetitive search patterns."""
    if tool_name not in ('Grep', 'Glob'):
        state['consecutive_searches'] = 0
        return

    consecutive = state.get('consecutive_searches', 0) + 1
    state['consecutive_searches'] = consecutive

    if consecutive == 5:
        print(
            "SEARCH LOOP DETECTED: 5 consecutive searches. "
            "Consider narrowing your search or reading the Key File Registry "
            "in CLAUDE.local.md for known file locations.",
            file=sys.stderr
        )


def main():
    try:
        input_data = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, Exception):
        sys.exit(0)

    tool_name = input_data.get('tool_name', '')
    tool_input = input_data.get('tool_input', {})
    session_id = input_data.get('session_id', 'unknown')

    state = load_state(session_id)
    if not state:
        sys.exit(0)

    # Run checks
    check_exploration_spiral(state)
    check_test_cycle(state, tool_name, tool_input)
    check_search_loop(state, tool_name)

    # Save updated state
    save_state(session_id, state)

    sys.exit(0)


if __name__ == '__main__':
    main()
