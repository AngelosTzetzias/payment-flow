# Agentic Tooling (Pillar 2)

This repo ships its own Claude Code tooling as a first-class, co-equal deliverable. The pitch: **"I built the product _and_ the agentic system that builds it — and the system gets smarter over time."**

## What's here

All under `.claude/`:

### Skills (`.claude/skills/`)

Task-area playbooks the agent invokes when doing recurring work:

- **`backend-feature`** — scaffold a NestJS module (controller/service/DTOs/Prisma/tests) the repo's way.
- **`rn-screen`** — scaffold an Expo screen wired to the API/WebSocket with the app's patterns.
- **`truelayer`** — the PIS integration playbook (direct settlement, webhook verification, sandbox↔live).
- **`retro`** — the self-improvement loop (below).

### Subagents (`.claude/agents/`)

- **`test-writer`** — generates/extends Jest tests, focused on money math, the status state machine, auth guards, and the webhook handler.
- **`code-reviewer`** — reviews the working diff against the repo's guardrails before commit.

### SessionStart hook (`.claude/hooks/session-start.sh`)

Bootstraps a fresh (web/CI) session: installs deps, starts Postgres, generates the Prisma client — so tests and lint can run immediately.

## Self-improvement: the human-gated retro loop

After each stage (or a notable correction), the `retro` skill:

1. reviews what happened — corrections, dead-ends, undocumented conventions;
2. proposes **diffs** to the relevant skill / `CLAUDE.md` files;
3. **waits for the user to approve** which to apply (no autonomous self-rewriting);
4. commits each accepted retro separately (`retro: <learning>`).

Because every accepted learning is a commit to the skill files, **the git history visibly shows the tooling getting smarter** — that history is itself part of the showcase. The "self-improvement" is durable (committed) and trustworthy (human-gated), not a black box.
