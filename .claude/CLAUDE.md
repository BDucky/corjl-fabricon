# Global AI Rules

## Tool Usage Rules

- **ALWAYS batch independent tool calls in parallel.** If you need to read 3 files or run 3 searches that don't depend on each other, issue ALL of them in a single turn. Never do sequential single-tool turns for independent operations.
- **Use Grep for content search.** Do NOT use bash `grep`, `rg`, or Serena `search_for_pattern`.
- **Use Glob for file discovery.** Do NOT use bash `find`, `ls`, or Serena `find_file`/`list_dir`.
- **Always use `limit` parameter when reading files.** Use `limit=50` for exploration, `limit=100+` for understanding full context. Never read entire large files without a limit unless you specifically need the whole file.
- **Never read the same file twice.** If you need more context from a file you already read, read a larger range once — do not progressively read 25, then 50, then 70 lines.
- **Minimize TodoWrite usage.** Only use TodoWrite for complex multi-step tasks. For simple 1-3 step tasks, just do the work directly.

## Session Management

- **One task per session.** Each session should focus on ONE ticket, ONE bug fix, or ONE feature. After committing/creating MR, suggest starting a new session for the next task.
- **Use `/compact` proactively** after completing a subtask within a long session to free context.
- **If a session exceeds 50 tool calls**, evaluate if you should compact or suggest the user start a fresh session.

## Prompt Efficiency

- When the user provides a specific file path, read it directly — do not search for it.
- When the user provides a ticket ID, fetch the ticket immediately — do not explore the codebase first.
- Before editing multiple files, confirm scope with the user to avoid revert cycles.

## Git Workflow

- **Always create a feature branch.** Never commit directly to `dev`, `test`, `stage`, or `prod`.
- **Make minimal, targeted changes.** Do not fix adjacent issues unless explicitly asked.
- **Before implementing across multiple files**, confirm the scope with the user.
