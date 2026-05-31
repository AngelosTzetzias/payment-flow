#!/usr/bin/env bash
# SessionStart hook: make web/CI sessions able to build, lint and test the repo.
# Idempotent and non-fatal — it surfaces context, it does not block the session.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || exit 0

echo "=== payment-flow session bootstrap ==="

# 1. Install deps if node_modules is missing.
if [ ! -d "node_modules" ]; then
  echo "Installing workspace dependencies (pnpm install)..."
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install || echo "WARN: pnpm install failed"
fi

# 2. Start Postgres if Docker is available and the DB isn't already up.
if command -v docker >/dev/null 2>&1; then
  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q payment-flow-postgres; then
    echo "Starting Postgres (docker compose)..."
    docker compose up -d postgres 2>/dev/null || echo "WARN: could not start Postgres"
  fi
else
  echo "Docker not available — skipping Postgres startup."
fi

# 3. Generate the Prisma client so the backend typechecks.
if [ -f "apps/backend/prisma/schema.prisma" ]; then
  pnpm --filter @payment-flow/backend prisma:generate 2>/dev/null || echo "WARN: prisma generate skipped"
fi

echo "Bootstrap complete. Run 'pnpm test' / 'pnpm lint' to verify."
exit 0
