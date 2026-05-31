---
name: todo
description: Lightweight checklist convention for multi-step work. Use when a task spans 3+ steps or multiple commits (e.g. a staged build slice) and you want visible, ordered progress — this environment has no built-in todo tool.
---

# todo

A convention for tracking multi-step work when no native todo tool is available.

## When to use

- A task spans 3+ steps or multiple commits (e.g. a staged build slice).
- The user benefits from seeing ordered progress and what's next.

## How

- Open the work by posting a short ordered checklist (`- [ ]` items), one line per step.
- For a build stage, mirror it in the plan file under `/root/.claude/plans/`.
- After each step lands green (typecheck/test/lint), repost the list with `- [x]` and a one-line status. Don't narrate every sub-action — the checklist + commit is the record.
- Map one checklist item ≈ one commit where it makes sense, so git history mirrors the list.

## Done when

The final item is checked, all gates are green, and the work is committed/pushed.
