#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

"""
Post-tool-use hook for Corjl Webapp monorepo.

Features:
- Log all tool usage
- Monitor build/lint/typecheck/test failures
- Track command execution metrics
- Summarize errors for quick feedback
"""

import json
import os
import sys
import re
from pathlib import Path
from datetime import datetime

from utils.constants import ensure_session_log_dir


def parse_build_output(output, tool_result):
    """
    Parse build command output for errors.
    Returns dict with error summary.
    """
    errors = {
        'type': 'build',
        'has_errors': False,
        'error_count': 0,
        'errors': [],
        'warnings': []
    }

    if not output:
        return errors

    # Check for Vite/Rollup build errors
    vite_error_patterns = [
        r'error during build',
        r'\[vite\].*error',
        r'Build failed',
        r'ERROR\s+in\s+',
    ]

    for pattern in vite_error_patterns:
        if re.search(pattern, output, re.IGNORECASE):
            errors['has_errors'] = True
            break

    # Count TypeScript errors in build output
    ts_errors = re.findall(r'TS\d+:', output)
    if ts_errors:
        errors['has_errors'] = True
        errors['error_count'] = len(ts_errors)

    # Extract error messages (first 5)
    error_lines = [line for line in output.split('\n')
                   if re.search(r'error|Error|ERROR', line, re.IGNORECASE)]
    errors['errors'] = error_lines[:5]

    return errors


def parse_lint_output(output, tool_result):
    """
    Parse ESLint output for errors and warnings.
    Returns dict with error summary.
    """
    errors = {
        'type': 'lint',
        'has_errors': False,
        'error_count': 0,
        'warning_count': 0,
        'errors': [],
        'fixable': 0
    }

    if not output:
        return errors

    # Parse ESLint summary line: "X problems (Y errors, Z warnings)"
    summary_match = re.search(r'(\d+)\s+problems?\s+\((\d+)\s+errors?,\s+(\d+)\s+warnings?\)', output)
    if summary_match:
        errors['error_count'] = int(summary_match.group(2))
        errors['warning_count'] = int(summary_match.group(3))
        errors['has_errors'] = errors['error_count'] > 0

    # Check for fixable issues
    fixable_match = re.search(r'(\d+)\s+errors?\s+and\s+\d+\s+warnings?\s+potentially\s+fixable', output)
    if fixable_match:
        errors['fixable'] = int(fixable_match.group(1))

    # Extract first few error lines
    error_lines = re.findall(r'^\s+\d+:\d+\s+error\s+.+$', output, re.MULTILINE)
    errors['errors'] = error_lines[:5]

    return errors


def parse_typecheck_output(output, tool_result):
    """
    Parse TypeScript typecheck output.
    Returns dict with error summary.
    """
    errors = {
        'type': 'typecheck',
        'has_errors': False,
        'error_count': 0,
        'errors': [],
        'files_with_errors': []
    }

    if not output:
        return errors

    # Count TS errors
    ts_errors = re.findall(r'error TS\d+:', output)
    errors['error_count'] = len(ts_errors)
    errors['has_errors'] = errors['error_count'] > 0

    # Extract files with errors
    file_errors = re.findall(r'^([^\s]+\.(?:ts|vue|tsx)):\d+:\d+', output, re.MULTILINE)
    errors['files_with_errors'] = list(set(file_errors))[:10]

    # Extract first few error messages
    error_lines = re.findall(r'error TS\d+:.+', output)
    errors['errors'] = error_lines[:5]

    return errors


def parse_test_output(output, tool_result):
    """
    Parse test runner output (Playwright/Vitest).
    Returns dict with test summary.
    """
    results = {
        'type': 'test',
        'has_failures': False,
        'passed': 0,
        'failed': 0,
        'skipped': 0,
        'failed_tests': []
    }

    if not output:
        return results

    # Playwright format: "X passed, Y failed"
    playwright_match = re.search(r'(\d+)\s+passed.*?(\d+)\s+failed', output)
    if playwright_match:
        results['passed'] = int(playwright_match.group(1))
        results['failed'] = int(playwright_match.group(2))
        results['has_failures'] = results['failed'] > 0

    # Vitest format
    vitest_pass = re.search(r'Tests\s+(\d+)\s+passed', output)
    vitest_fail = re.search(r'Tests\s+(\d+)\s+failed', output)
    if vitest_pass:
        results['passed'] = int(vitest_pass.group(1))
    if vitest_fail:
        results['failed'] = int(vitest_fail.group(1))
        results['has_failures'] = results['failed'] > 0

    # Extract failed test names
    failed_tests = re.findall(r'FAIL\s+(.+)', output)
    results['failed_tests'] = failed_tests[:5]

    return results


def analyze_command_result(command, output, tool_result):
    """
    Analyze command output and return structured result.
    """
    analysis = {
        'command': command,
        'timestamp': datetime.now().isoformat(),
        'exit_code': tool_result.get('exit_code', 0) if isinstance(tool_result, dict) else 0,
        'analysis': None
    }

    # Determine command type and parse accordingly
    if re.search(r'pnpm\s+(cli\s+)?build', command):
        analysis['analysis'] = parse_build_output(output, tool_result)
    elif re.search(r'pnpm\s+(cli\s+)?lint', command):
        analysis['analysis'] = parse_lint_output(output, tool_result)
    elif re.search(r'pnpm\s+(cli\s+)?typecheck', command):
        analysis['analysis'] = parse_typecheck_output(output, tool_result)
    elif re.search(r'pnpm\s+(test|playwright)', command):
        analysis['analysis'] = parse_test_output(output, tool_result)

    return analysis


def log_tool_use(session_id, input_data, analysis=None):
    """Log tool usage to session directory."""
    log_dir = ensure_session_log_dir(session_id)
    log_path = log_dir / 'post_tool_use.json'

    if log_path.exists():
        with open(log_path, 'r') as f:
            try:
                log_data = json.load(f)
            except (json.JSONDecodeError, ValueError):
                log_data = []
    else:
        log_data = []

    # Add analysis to input data if available
    if analysis:
        input_data['_analysis'] = analysis

    log_data.append(input_data)

    with open(log_path, 'w') as f:
        json.dump(log_data, f, indent=2)


def log_build_metrics(session_id, analysis):
    """
    Log build/test metrics separately for easy tracking.
    """
    if not analysis or not analysis.get('analysis'):
        return

    log_dir = ensure_session_log_dir(session_id)
    metrics_path = log_dir / 'build_metrics.json'

    if metrics_path.exists():
        with open(metrics_path, 'r') as f:
            try:
                metrics = json.load(f)
            except (json.JSONDecodeError, ValueError):
                metrics = []
    else:
        metrics = []

    metrics.append({
        'timestamp': analysis['timestamp'],
        'command': analysis['command'],
        'type': analysis['analysis'].get('type'),
        'has_errors': analysis['analysis'].get('has_errors', False) or analysis['analysis'].get('has_failures', False),
        'error_count': analysis['analysis'].get('error_count', 0) + analysis['analysis'].get('failed', 0),
    })

    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)


def main():
    try:
        input_data = json.load(sys.stdin)

        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        tool_result = input_data.get('tool_result', {})
        session_id = input_data.get('session_id', 'unknown')

        analysis = None

        # Analyze Bash command results
        if tool_name == 'Bash':
            command = tool_input.get('command', '')
            output = ''

            # Extract output from tool_result
            if isinstance(tool_result, dict):
                output = tool_result.get('stdout', '') + tool_result.get('stderr', '')
            elif isinstance(tool_result, str):
                output = tool_result

            # Analyze build/lint/test commands
            if re.search(r'pnpm\s+(cli\s+)?(build|lint|typecheck|test|playwright)', command):
                analysis = analyze_command_result(command, output, tool_result)

                # Log metrics separately
                log_build_metrics(session_id, analysis)

                # Print summary to stderr for visibility
                if analysis['analysis']:
                    a = analysis['analysis']
                    if a.get('has_errors') or a.get('has_failures'):
                        error_count = a.get('error_count', 0) + a.get('failed', 0)
                        print(f"[{a['type'].upper()}] {error_count} error(s) detected", file=sys.stderr)

        # Log all tool usage
        log_tool_use(session_id, input_data, analysis)

        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception:
        sys.exit(0)


if __name__ == '__main__':
    main()
