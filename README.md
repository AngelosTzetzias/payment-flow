# payment-flow

A Pay-by-Bank payment platform POC for independent merchants (barbers, food stalls): customers pay directly from their bank account via QR/NFC using Open Banking — no card rails, lower merchant fees, no app install for the customer.

This repo has **two co-equal pillars**:

1. **The product** — a NestJS backend, a Next.js customer checkout, and an Expo (React Native) merchant app, integrated with TrueLayer for Open Banking payment initiation.
2. **A self-improving agentic-tooling layer** — Claude Code skills, subagents, and a SessionStart hook (`.claude/`) that build the product and improve over time via a human-gated retro loop. See [`docs/agentic-tooling.md`](docs/agentic-tooling.md).

## Validating

- **Speed:** can a customer pay in under 15 seconds with no app install?
- **Merchant pull:** would merchants prefer it over card terminals (lower fees)?

## Repo layout

```
apps/backend     NestJS API + WebSocket gateway + Prisma + TrueLayer
apps/checkout    Next.js customer web app (no install)        [Stage 1+]
apps/merchant    Expo (React Native) merchant app             [Stage 1+]
packages/shared  Shared TypeScript contract types
.claude/         Agentic tooling (skills, subagents, hooks)
docs/            Architecture, agentic-tooling, fee model
```

## Getting started

```bash
pnpm install
pnpm db:up                 # start Postgres via Docker
cp apps/backend/.env.example apps/backend/.env
pnpm --filter @payment-flow/backend prisma:migrate
pnpm --filter @payment-flow/backend prisma:seed
pnpm --filter @payment-flow/backend start:dev
```

Quality gates (also enforced in CI): `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`.

## Status

Stage 0 (foundation, quality scaffolding, agentic tooling) — in place. See [`docs/architecture.md`](docs/architecture.md) for the staged build plan.

## Design guardrails

Money is integer minor units; no pooled funds (payments settle to the merchant's own account directly); external input is untrusted; secrets live in `.env`. See [`CLAUDE.md`](CLAUDE.md).
