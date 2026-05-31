---
name: truelayer
description: Playbook for the TrueLayer Open Banking (PIS) integration in apps/backend — creating single-immediate payments to the merchant beneficiary, verifying webhooks, and switching between sandbox and live. Use when touching payment initiation or the TrueLayer webhook.
---

# truelayer

Playbook for the TrueLayer payment-initiation (PIS) integration.

## Non-negotiable guardrails

- **Direct settlement only.** The payment beneficiary is always the merchant's own bank account (from the `Merchant` record). NEVER pool funds into a platform account — that crosses into FCA safeguarding territory and is out of scope.
- **Sandbox vs live is config, not code.** Branch on `TRUELAYER_ENV`; never hardcode hosts or credentials.
- **Verify webhook signatures.** Reject unsigned/invalid webhooks. Treat the webhook body as untrusted input.
- **Webhook is not the only path.** Keep a status-poll fallback — sandbox webhooks can be slow/unreliable.

## Flow

1. Client-credentials token (cache until expiry).
2. Create payment: single immediate payment, amount in minor units, beneficiary = merchant account, `redirect_uri` from env. Persist `trueLayerPaymentId` on the `PaymentRequest`.
3. Return the bank-auth/hosted-payment-page URL to the checkout for redirect.
4. On webhook (or poll): map TrueLayer status → our `PaymentStatus`, set `paidAt` on success, emit the `payment.updated` WS event.

## Verify during implementation

- Exact PIS payload + beneficiary field names against current TrueLayer docs.
- Webhook signature scheme (JWS / Tl-Signature header).
- **Live per-transaction pricing** — feeds `/docs/fee-model.md`; the whole value-prop depends on it.

## Done when

A sandbox payment moves a `PaymentRequest` pending → paid via a signature-verified webhook (with poll fallback), and the merchant app receives the live update.
