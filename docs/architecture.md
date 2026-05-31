# Architecture

## Components (Pillar 1 — the product)

```
Merchant App (Expo RN)  ──auth + create request──▶  NestJS Backend  ──▶  Postgres (Prisma)
        ▲   (WebSocket: status push)                     │
        │                                                 ├──▶ TrueLayer (PIS: sandbox → live)
Customer phone ──scan QR / tap NFC──▶ Next.js Checkout ──▶ Backend ──▶ TrueLayer auth ──▶ Customer bank
                                                          ▲
                                                 TrueLayer webhook ──▶ mark paid ──▶ WS push to merchant
```

- **Merchant app (`apps/merchant`, Expo RN):** login, create payment request, dynamic QR, live status via WebSocket, history, dashboard, NFC sticker programming + HCE "tap my phone" (Android).
- **Customer checkout (`apps/checkout`, Next.js):** no install. Entry points `/m/:merchantId` (sticker/QR → resolves active request) and `/p/:paymentId` (direct / HCE). "Pay by Bank" → TrueLayer redirect → result screen.
- **Backend (`apps/backend`, NestJS):** the shared brain — auth, payment-request lifecycle, TrueLayer PIS, signature-verified webhook, WebSocket gateway, dashboard/history data. The two frontends never talk directly; both go through the backend.

## Data model

`User` (auth principal) → owns `Merchant`(s) → each has `PaymentRequest`(s). No wallet/balance model — payments settle to the merchant's beneficiary account directly. See `apps/backend/prisma/schema.prisma`.

## NFC design

- **Static sticker (universal):** holds `pay.example.com/m/:merchantId`; checkout resolves the merchant's currently-pending request. Static sticker, dynamic amount. Works regardless of merchant phone.
- **HCE "tap my phone" (Android merchant only):** merchant phone emulates a Type 4 NDEF tag presenting `pay.example.com/p/:paymentId` directly. iOS has no third-party HCE, so this is Android-merchant-only; needs an Expo dev build.

## Build stages

0. Foundation, quality scaffolding, agentic tooling. **(current)**
1. Auth + core payment loop (mock money).
2. TrueLayer sandbox.
3. History + dashboard.
4. NFC static sticker (required before field testing).
5. One real £1 payment + stopwatch (the honest <15s test).
6. HCE "tap my phone" (Android enhancement / showcase).
7. Social login for the merchant app (Google/Apple alongside email+password). Adds a provider strategy on the existing `TokenService` seam (Stage 1), makes `User.passwordHash` nullable, and adds a provider/account link. Can be pulled forward once the merchant app has matured (naturally pairs with Stage 3).

Run the `retro` skill at the end of each stage.
