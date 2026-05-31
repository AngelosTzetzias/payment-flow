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
- Services own all `PrismaService` access and business rules. Inject `PrismaService` (it's `@Global`).
- Money is always `amountMinor: number` (integer pence). Never floats. Convert major→minor at the edge.
- Request/response shapes that cross the wire MUST reuse types from `@payment-flow/shared` — add them there if missing, don't redefine.
- Merchant-scoped routes use `JwtAuthGuard` and read the merchant from the authed principal — never trust a merchantId from the body.

## Steps

1. Add/confirm shared types in `packages/shared/src/index.ts`.
2. Update `prisma/schema.prisma` if new persistence is needed; create a migration (`pnpm --filter @payment-flow/backend prisma:migrate`).
3. Scaffold the module files; register the module in `app.module.ts`.
4. Write a `*.service.spec.ts` covering the happy path + one failure path (delegate to the `test-writer` agent for breadth).
5. Run `pnpm --filter @payment-flow/backend typecheck && pnpm --filter @payment-flow/backend test`.

## Done when

Typecheck + unit tests pass, the module is registered, and any cross-wire shape lives in `@payment-flow/shared`.
