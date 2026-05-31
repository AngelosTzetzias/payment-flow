# Session Handoff — payment-flow

Paste or point a new Claude Code session at this file to resume work with full context.

## What we're building

Two co-equal pillars:

1. **Product** — a Pay-by-Bank platform for independent merchants (barbers, food stalls). Customers pay directly from their bank via Open Banking (TrueLayer), using QR/NFC, no card rails, no customer app install.
2. **Agentic tooling (showcased)** — the repo's own Claude Code skills/subagents/hook in `.claude/`, that build the product and self-improve via a **human-gated retro loop**. Pitch: _"I built the product AND the agentic system that builds it."_

Hypotheses being validated: (1) can a customer pay in **under 15s, no install**? (2) would merchants **prefer it over card terminals** (lower fees)?

## Key decisions (locked)

- **Goal:** well-crafted GitHub showcase **and** a learning vehicle (not a throwaway POC).
- **Core features, first-class from day one:** merchant login/auth, payment history, multi-merchant data model, dashboard/totals.
- **Quality bar from the start:** tests, GitHub Actions CI (lint/format/typecheck/test), Docker Compose + docs, ESLint/Prettier + shared tsconfig.
- **No pooled funds — ever.** Every payment settles bank → the merchant's own beneficiary account directly. Pooling = FCA safeguarding territory, out of scope.
- **Money is integer minor units (pence).** No floats.
- **Realtime:** NestJS WebSocket gateway (no Pusher/Supabase).
- **Merchant app:** React Native + Expo. **Customer checkout:** Next.js web. **Backend:** NestJS + Prisma + Postgres.
- **NFC = two mechanisms:** (a) static sticker holding `/m/:merchantId` → checkout resolves the merchant's currently-pending request (universal, any merchant phone); (b) "tap my phone" via HCE presenting `/p/:paymentId` directly — **Android merchant only** (no third-party HCE on iOS; needs an Expo dev build), via `react-native-hce`.
- **Self-improvement = human-gated retro loop:** the `retro` skill proposes diffs to skill/CLAUDE.md files; user approves; each accepted retro is its own commit.

## Staged build plan

0. **Foundation, quality scaffolding, agentic tooling — DONE & pushed.**
1. Auth (JWT/bcrypt) + core payment loop with mock money + WebSocket gateway; scaffold Next.js checkout (`/p/:id`, `/m/:merchantId`) and Expo merchant app (login, create request, QR, live status).
2. TrueLayer sandbox: real PIS + signature-verified webhook + poll fallback; remove mock.
3. History + dashboard (endpoints + screens).
4. NFC static sticker (required before field testing) — **needs physical devices, run by the human.**
5. One real £1 payment direct to own account + stopwatch the real-SCA flow — **needs real bank, run by the human.**
6. HCE "tap my phone" (Android enhancement/showcase) — **needs an Android device + Expo dev build.**

Run the `retro` skill at the end of each stage.

> Note: Stages 4–6 require physical hardware / real money and cannot be completed in a cloud sandbox — build the code, the human verifies on-device.

## Current status (end of this session)

**Stage 0 complete, committed, and pushed to branch `claude/adoring-thompson-k8niS`.** A PR is open.

In place:

- pnpm monorepo: `apps/backend` (NestJS skeleton + health endpoint), `packages/shared` (contract types), `apps/checkout` and `apps/merchant` not yet created (Stage 1).
- Prisma schema + **initial migration committed** (`User`, `Merchant`, `PaymentRequest`; multi-merchant + auth designed in; no pooled-funds model).
- `.claude/` tooling: skills (`backend-feature`, `rn-screen`, `truelayer`, `retro`), subagents (`test-writer`, `code-reviewer`), SessionStart hook.
- CI green; docs in `docs/` (architecture, agentic-tooling, fee-model); `CLAUDE.md` holds conventions/guardrails.

**Paused for the human to review the code and manually test Stage 0** (see README "Run it locally" + the PR's manual-test checklist).

## How to resume in a new session

1. Read `CLAUDE.md` (conventions/guardrails), `docs/architecture.md` (stages), and this file.
2. Confirm Stage 0 review feedback (if any) is addressed.
3. **Start Stage 1.** Use the `backend-feature` skill for the auth + payment-requests modules and the `rn-screen` skill for the merchant app. Use `test-writer` and `code-reviewer` before committing. Run `retro` when Stage 1 is done.
4. Keep developing on branch `claude/adoring-thompson-k8niS` unless told otherwise.

## Key files

- Plan/decisions: this file + `docs/architecture.md`.
- Backend: `apps/backend/src/`, schema at `apps/backend/prisma/schema.prisma`.
- Shared contracts: `packages/shared/src/index.ts`.
- Tooling: `.claude/skills/`, `.claude/agents/`, `.claude/hooks/session-start.sh`, `.claude/settings.json`.
