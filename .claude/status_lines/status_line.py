#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "python-dotenv",
# ]
# ///
# Note: Can also run with: uv run --script status_line.py

"""
Universal status line for Corjl projects.
Displays: [Project] [Agent] [Model] [Git Branch] [Git Status] [Current Prompt]

This file can be shared across all Corjl projects - PROJECT_NAME is derived dynamically.
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional


# Configuration
SHOW_GIT_INFO = True
MAX_PROMPT_LENGTH = 50  # Maximum characters to display for prompt
MAX_LOG_ENTRIES = 100  # Maximum log entries to keep (prevents unlimited growth)


def get_project_name():
    """
    Get project name dynamically from multiple sources:
    1. Git remote URL (preferred - gives actual repo name)
    2. CLAUDE_PROJECT_DIR folder name (fallback)
    3. Current working directory name (last fallback)

    Returns formatted name like "Service Integrations" from "service-integrations"
    """
    project_name = None

    # Try to get from git remote
    try:
        result = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            capture_output=True,
            text=True,
            timeout=2,
        )
        if result.returncode == 0:
            remote_url = result.stdout.strip()
            # Extract repo name from URL
            # Handle both HTTPS and SSH formats:
            # https://github.com/org/repo-name.git
            # git@github.com:org/repo-name.git
            if remote_url.endswith(".git"):
                remote_url = remote_url[:-4]
            project_name = remote_url.split("/")[-1].split(":")[-1]
    except Exception:
        pass

    # Fallback to CLAUDE_PROJECT_DIR
    if not project_name:
        project_dir = os.environ.get("CLAUDE_PROJECT_DIR")
        if project_dir:
            project_name = Path(project_dir).name

    # Last fallback to current directory
    if not project_name:
        project_name = Path.cwd().name

    # Format: "service-integrations" -> "Service Integrations"
    # Also handle underscores: "my_project" -> "My Project"
    formatted_name = project_name.replace("-", " ").replace("_", " ")
    formatted_name = " ".join(word.capitalize() for word in formatted_name.split())

    return formatted_name


def log_status_line(input_data, status_line_output, error_message=None):
    """Log status line event to .ai/logs directory in project root."""
    # Use CLAUDE_PROJECT_DIR to ensure logs go to project root, not current working directory
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    log_dir = Path(project_dir) / ".ai" / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "status_line.json"

    # Read existing log data or initialize empty list
    if log_file.exists():
        with open(log_file, "r") as f:
            try:
                log_data = json.load(f)
            except (json.JSONDecodeError, ValueError):
                log_data = []
    else:
        log_data = []

    # Create log entry with input data and generated output
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "input_data": input_data,
        "status_line_output": status_line_output,
    }

    if error_message:
        log_entry["error"] = error_message

    # Append the log entry
    log_data.append(log_entry)

    # Keep only the last MAX_LOG_ENTRIES to prevent unlimited growth
    if len(log_data) > MAX_LOG_ENTRIES:
        log_data = log_data[-MAX_LOG_ENTRIES:]

    # Write back to file with formatting
    with open(log_file, "w") as f:
        json.dump(log_data, f, indent=2)


def get_git_branch():
    """Get current git branch if in a git repository."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True,
            text=True,
            timeout=2,
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None


def get_git_status():
    """Get git status indicators with detailed breakdown and GitHub-style colors."""
    # ANSI color codes (GitHub-style)
    GREEN = "\033[32m"   # Staged - like GitHub added
    YELLOW = "\033[33m"  # Modified/unstaged - like GitHub changed
    RED = "\033[31m"     # Untracked - like GitHub deleted/new
    RESET = "\033[0m"

    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True,
            timeout=2,
        )
        if result.returncode == 0:
            changes = result.stdout.strip()
            if changes:
                lines = changes.split("\n")
                staged = sum(1 for line in lines if line and line[0] in "MADRCU")
                unstaged = sum(1 for line in lines if line and len(line) > 1 and line[1] in "MADRCU")
                untracked = sum(1 for line in lines if line.startswith("??"))

                parts = []
                if staged:
                    parts.append(f"{GREEN}+{staged}{RESET}")
                if unstaged:
                    parts.append(f"{YELLOW}~{unstaged}{RESET}")
                if untracked:
                    parts.append(f"{RED}?{untracked}{RESET}")

                return " ".join(parts) if parts else ""
    except Exception:
        pass
    return ""


def get_claude_projects_dir():
    """Get the Claude Code projects directory path."""
    return Path.home() / ".claude" / "projects"


def get_project_folder_name():
    """Get the encoded project folder name for Claude Code."""
    # Get project directory from environment or current working directory
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
    # Claude Code encodes paths by replacing / with -
    return project_dir.replace("/", "-")


def is_real_user_prompt(content):
    """Check if content is a real user prompt (not meta/command message)."""
    if not content or not isinstance(content, str):
        return False
    # Skip meta messages and command outputs
    skip_patterns = [
        "<local-command-",
        "<command-name>",
        "<system-reminder>",
        "tool_use_id",
        "tool_result",
    ]
    return not any(pattern in content for pattern in skip_patterns)


def get_session_data_from_project(session_id):
    """Get session data from project-local .claude/data/sessions directory."""
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    session_file = Path(project_dir) / ".claude" / "data" / "sessions" / f"{session_id}.json"

    if not session_file.exists():
        return None, f"Session file {session_file} does not exist"

    try:
        with open(session_file, "r") as f:
            session_data = json.load(f)
            return session_data, None
    except Exception as e:
        return None, f"Error reading session file: {str(e)}"


def get_session_data_from_global(session_id):
    """Get session data from global ~/.claude/projects directory (JSONL format)."""
    try:
        claude_projects_dir = get_claude_projects_dir()
        project_folder = get_project_folder_name()
        session_file = claude_projects_dir / project_folder / f"{session_id}.jsonl"

        if not session_file.exists():
            return None, f"Session file {session_file} does not exist"

        # Parse JSONL file to extract user prompts
        prompts = []
        agent_name = None
        with open(session_file, "r") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                    # Skip meta messages
                    if entry.get("isMeta"):
                        continue
                    # Look for user messages in the conversation
                    if entry.get("type") == "user":
                        message = entry.get("message", {})
                        content = message.get("content", "")
                        # Handle both string and array content
                        if isinstance(content, str):
                            if is_real_user_prompt(content):
                                prompts.append(content)
                        elif isinstance(content, list):
                            for item in content:
                                if isinstance(item, dict) and item.get("type") == "text":
                                    text = item.get("text", "")
                                    if is_real_user_prompt(text):
                                        prompts.append(text)
                except json.JSONDecodeError:
                    continue

        return {"prompts": prompts, "agent_name": agent_name}, None
    except Exception as e:
        return None, f"Error reading session file: {str(e)}"


def get_session_data(session_id):
    """
    Get session data, trying both project-local and global locations.
    Returns (session_data, error_message)
    """
    # Try project-local first
    session_data, error = get_session_data_from_project(session_id)
    if session_data:
        return session_data, None

    # Fall back to global
    return get_session_data_from_global(session_id)


def truncate_prompt(prompt, max_length=MAX_PROMPT_LENGTH):
    """Truncate prompt to specified length."""
    # Remove newlines and excessive whitespace
    prompt = " ".join(prompt.split())

    if len(prompt) > max_length:
        return prompt[:max_length - 3] + "..."
    return prompt


def get_prompt_icon(prompt):
    """Get icon based on prompt type (colored emoji style)."""
    if prompt.startswith("/"):
        return ">"
    elif "?" in prompt:
        return "?"
    elif any(
        word in prompt.lower()
        for word in ["create", "write", "add", "implement", "build"]
    ):
        return "+"
    elif any(word in prompt.lower() for word in ["fix", "debug", "error", "issue"]):
        return "!"
    elif any(word in prompt.lower() for word in ["refactor", "improve", "optimize"]):
        return "~"
    else:
        return "#"


def generate_status_line(input_data):
    """Generate the status line with project info, agent, model, git status, and prompt."""
    # Get project name dynamically
    project_name = get_project_name()

    # Extract session ID from input data
    session_id = input_data.get("session_id", "unknown")

    # Get model name
    model_info = input_data.get("model", {})
    model_name = model_info.get("display_name", "Claude")

    # Try to get session data from file (fallback)
    session_data, _ = get_session_data(session_id)

    # Build status line components
    parts = []

    # Project name - White
    parts.append(f"\033[97m[{project_name}]\033[0m")

    # Agent name - Red (check input_data first, then session_data)
    agent_name = input_data.get("agent_name") or input_data.get("agent")
    if not agent_name and session_data:
        agent_name = session_data.get("agent_name")
    if agent_name:
        parts.append(f"\033[91m[{agent_name}]\033[0m")

    # Model name - Yellow
    parts.append(f"\033[33m[{model_name}]\033[0m")

    # Git branch (green) and status (multi-colored)
    if SHOW_GIT_INFO:
        git_branch = get_git_branch()
        if git_branch:
            git_status = get_git_status()
            # Branch name in green
            git_info = f"\033[32m{git_branch}\033[0m"
            if git_status:
                # Status already has its own colors
                git_info += f" ({git_status})"
            parts.append(git_info)

    # Most recent prompt - check input_data first, then session_data
    current_prompt = None

    # Check various possible keys in input_data
    if input_data.get("prompt"):
        current_prompt = input_data.get("prompt")
    elif input_data.get("last_prompt"):
        current_prompt = input_data.get("last_prompt")
    elif input_data.get("current_prompt"):
        current_prompt = input_data.get("current_prompt")
    elif session_data:
        prompts = session_data.get("prompts", [])
        if prompts:
            current_prompt = prompts[-1]

    if current_prompt:
        icon = get_prompt_icon(current_prompt)
        truncated = truncate_prompt(current_prompt, MAX_PROMPT_LENGTH)
        parts.append(f"{icon} \033[97m{truncated}\033[0m")

    return " | ".join(parts)


def main():
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())

        # Generate status line
        status_line = generate_status_line(input_data)

        # Log the status line event
        log_status_line(input_data, status_line)

        # Output the status line
        print(status_line)

        sys.exit(0)

    except json.JSONDecodeError:
        project_name = get_project_name()
        print(f"\033[97m[{project_name}]\033[0m \033[33m[Claude]\033[0m")
        sys.exit(0)
    except Exception as e:
        project_name = get_project_name()
        print(f"\033[31m[{project_name}] Error: {str(e)}\033[0m")
        sys.exit(0)


if __name__ == "__main__":
    main()
