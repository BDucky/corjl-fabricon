---
description: "Explore codebase via sub-agent. Args: <question>"
---

# Explore Codebase

Delegate codebase exploration to a sub-agent to protect the main context window.

**Why this exists:** Exploration can consume 15-40+ tool calls (searches, reads, greps). Running these in the main context fills the context window with intermediate results that are never needed again. A sub-agent does all the searching in its own context and returns only a compact summary.

## Instructions

1. Take the user's question from `$ARGUMENTS`
2. Use the **Task tool** with `subagent_type="Explore"` to investigate
3. Write a clear, detailed prompt for the sub-agent that includes:
   - The exact question to answer
   - What files/patterns to look for
   - What to include in the summary (file paths, function names, key logic)
4. When the sub-agent returns, present the findings as a concise summary
5. Do NOT perform any searches or file reads in the main context — delegate everything

## Rules

- NEVER search or read files directly — always delegate to the sub-agent
- The sub-agent prompt should be specific enough that it doesn't need clarification
- If the question is about a specific area, hint at known file paths from CLAUDE.md / CLAUDE.local.md
- Keep the returned summary under 50 lines

## Question

$ARGUMENTS
