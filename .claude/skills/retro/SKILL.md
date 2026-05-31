---
name: retro
description: Run the human-gated self-improvement loop. After a task or stage, review what happened (corrections, dead-ends, repeated mistakes) and propose edits to the relevant skill/playbook/CLAUDE.md files as a diff for the user to approve. Use at the end of a stage or after a notable correction.
---

# retro

The self-improvement loop for this repo's agentic tooling. **Human-gated: you propose, the user approves.** Never rewrite skill files autonomously without surfacing the diff.

## When to run

- At the end of a build stage (Stage 0–6).
- After the user corrects you in a way that would have been avoided by a better playbook.

## Procedure

1. **Review the session.** Identify: corrections the user made, dead-ends / retries, conventions discovered that aren't yet written down, and anything a future run would get wrong without guidance.
2. **Locate the right home** for each learning:
   - A convention for a task area → the matching skill (`backend-feature`, `rn-screen`, `truelayer`).
   - A cross-cutting fact about the repo → `CLAUDE.md`.
   - A new recurring task with no skill → propose a new skill folder.
3. **Propose edits as a concrete diff.** Show old → new for each file. Keep additions sharp and specific; prune stale guidance rather than only appending (sprawl reduces the tooling's value).
4. **Wait for approval.** Apply only what the user accepts.
5. **Commit separately.** Each accepted retro is its own commit (message: `retro: <what was learned>`) so git history shows the tooling getting smarter.

## Output format

A short "what I learned" list, then per-file proposed diffs, then ask the user which to apply. Do not apply before asking.
