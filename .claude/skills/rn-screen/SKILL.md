---
name: rn-screen
description: Scaffold a new screen in the Expo merchant app (apps/merchant) wired to the backend API and/or the WebSocket gateway, following the app's navigation and data-fetching patterns. Use when adding a merchant-app screen.
---

# rn-screen

Playbook for adding a screen to `apps/merchant` (Expo / React Native).

## Conventions (must follow)

- Screens live in `app/` (Expo Router) or `src/screens/`; keep one screen per file.
- API calls go through the shared API client (`src/lib/api.ts`) which attaches the JWT — never fetch the raw URL inline.
- Use types from `@payment-flow/shared` for request/response bodies. Don't hand-roll shapes.
- Real-time status uses the WebSocket helper (`src/lib/ws.ts`): subscribe with `WS_EVENTS.SUBSCRIBE`, handle `WS_EVENTS.UPDATED`. Always unsubscribe/clean up on unmount.
- Money is received as `amountMinor`; format to currency only at render time.
- Keep secrets/config in `app.config.ts` env, not hardcoded.

## Steps

1. Confirm the backend endpoint/event exists (use `backend-feature` first if not).
2. Add the screen, wire it into navigation.
3. Fetch via `src/lib/api.ts`; subscribe via `src/lib/ws.ts` if it shows live status.
4. Handle loading / empty / error states explicitly.
5. Typecheck the app.

## Done when

The screen renders with loading/empty/error states handled, uses shared types, and cleans up any WS subscription on unmount.
