---
name: backend-feature
description: Scaffold a new NestJS feature module in apps/backend following repo conventions (controller + service + DTOs + Prisma access + unit tests). Use when adding an endpoint or domain capability to the backend.
---

# backend-feature

Playbook for adding a feature module to `apps/backend`.

## Conventions (must follow)

- One folder per feature under `src/<feature>/`: `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`, `dto/`, `<feature>.service.spec.ts`.
- Controllers are thin: validate (DTOs + `class-validator`), delegate to the service, map to a shared type from `@payment-flow/shared`. No Prisma in controllers.
- DTOs are **classes** in `src/<feature>/dto/*.dto.ts` that `implements` the matching `@payment-flow/shared` contract type and carry `class-validator` decorators. Never type a controller `@Body()`/`@Query()` with a bare shared **interface** — interfaces erase at runtime, so the global `ValidationPipe` silently skips them. `packages/shared` stays runtime-dependency-free (no `class-validator` there).
- Services own all `PrismaService` access and business rules. Inject `PrismaService` (it's `@Global`) and query via `prismaService.client.<model>` — Prisma 7's client is composed inside the service, not subclassed.
- Import Prisma model/enum types (e.g. `PaymentStatus`) from the generated client under `src/generated/prisma/` with a `.js` extension (the backend is ESM), **not** from `@prisma/client` (Prisma 7 no longer publishes them there). The generated dir is gitignored; `prisma generate` runs via `postinstall` / the SessionStart hook before typecheck.
- Money is always `amountMinor: number` (integer pence). Never floats. Convert major→minor at the edge.
- Request/response shapes that cross the wire MUST reuse types from `@payment-flow/shared` — add them there if missing, don't redefine.
- Merchant-scoped routes use `JwtAuthGuard` and read the merchant from the authed principal — never trust a merchantId from the body.

## Steps

1. Add/confirm shared types in `packages/shared/src/index.ts`, then **rebuild shared** (`pnpm --filter @payment-flow/shared build`) — the backend imports the compiled `dist` (CJS), so new types are invisible until shared is rebuilt.
2. Update `prisma/schema.prisma` if new persistence is needed; create a migration (`pnpm --filter @payment-flow/backend prisma:migrate`).
3. Scaffold the module files; register the module in `app.module.ts`.
4. Write a `*.service.spec.ts` covering the happy path + one failure path (delegate to the `test-writer` agent for breadth).
5. Run `pnpm --filter @payment-flow/backend typecheck && pnpm --filter @payment-flow/backend test`.

## Testing (Jest + ESM)

The backend runs Jest under `--experimental-vm-modules`. The `jest` object is **not** a global here (only `describe`/`it`/`expect` are):

- `import { jest } from "@jest/globals";` in any spec that uses `jest.fn`/`jest.spyOn`/fake timers, and keep `@jest/globals` in devDependencies (typecheck needs it).
- `jest.fn()` from `@jest/globals` is strictly typed — give mocks a signature, e.g. `jest.fn<(args: unknown) => Promise<unknown>>()`, or `mockResolvedValue` infers `never`.
- For a timer-driven flow (e.g. a `setTimeout` settlement), advance with the **async** variant `await jest.advanceTimersByTimeAsync(ms)` so awaited work inside the callback flushes.
- Specs mock `PrismaService` (`{ client: { <model>: { … } } }`) — there's no live DB in CI / the web sandbox.

## Done when

Typecheck + unit tests pass, the module is registered, and any cross-wire shape lives in `@payment-flow/shared`.
