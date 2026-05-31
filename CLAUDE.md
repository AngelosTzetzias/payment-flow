# CLAUDE.md — payment-flow

Conventions and guardrails for working in this repo. The `retro` skill keeps this file current; treat it as the source of truth for cross-cutting decisions.

## What this repo is

Two co-equal pillars:

1. **Product** — a Pay-by-Bank platform for independent merchants. Customers pay from their bank via Open Banking (TrueLayer) using QR/NFC; no card rails.
2. **Agentic tooling** — the `.claude/` skills, subagents, and SessionStart hook that build the product and self-improve via the human-gated `retro` loop.

## Layout

- `apps/backend` — NestJS API + WebSocket gateway + Prisma + TrueLayer.
- `apps/checkout` — Next.js customer web app (no install).
- `apps/merchant` — Expo (React Native) merchant app.
- `packages/shared` — cross-wire TypeScript types. **All request/response shapes that cross process boundaries live here.**
- `.claude/` — Pillar 2 tooling. `docs/` — architecture, agentic-tooling writeup, fee model.

## Guardrails (do not violate)

- **No pooled funds / wallet / balance.** Every payment settles bank → the merchant's own beneficiary account directly. Pooling = FCA safeguarding territory, out of scope.
- **Money is integer minor units (`amountMinor`, pence).** Never use floats for money. Convert major→minor at the edge.
- **External input is untrusted.** TrueLayer webhooks must be signature-verified; the merchant identity comes from the authed JWT principal, never from a request body.
- **Sandbox vs live is config** (`TRUELAYER_ENV`), never hardcoded.
- **Secrets live in `.env`** (gitignored); document keys in `.env.example`.
- **Merchant bank details are sensitive PII.** `sortCode` / `accountNumber` / `beneficiaryAccountName` must be encrypted at rest before real data (Stage 1), never logged, and never returned in full by the API — mask to last-2 of the sort code and last-4 of the account number in any response DTO.

## Workflow

- Build in the staged sequence (see `/root/.claude/plans/...` and `docs/architecture.md`). Run `retro` at the end of each stage.
- Use the skills: `backend-feature`, `rn-screen`, `truelayer`. Use the `test-writer` and `code-reviewer` subagents before committing non-trivial work.
- Commands: `pnpm install`, `pnpm db:up`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm -r build`.

## Tech

pnpm workspaces · Node 22 · NestJS 10 + Prisma 6 + Postgres 16 · Next.js (checkout) · Expo/React Native (merchant) · NestJS WebSocket gateway for realtime (no Pusher/Supabase).
