/**
 * The authenticated principal attached to a request by `JwtAuthGuard` and read
 * via `@CurrentMerchant()`. Internal to the backend — not a cross-wire contract,
 * so it lives here rather than in `@payment-flow/shared`.
 */
export interface MerchantPrincipal {
  id: string;
  name: string;
  userId: string;
  email: string;
}

/** Claims carried in the signed JWT. */
export interface JwtPayload {
  sub: string;
  merchantId: string;
  merchantName: string;
  email: string;
}
