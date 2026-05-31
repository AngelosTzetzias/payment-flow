/**
 * Shared contract types between the NestJS backend, the Next.js customer
 * checkout, and the Expo merchant app. Keep this package free of runtime
 * dependencies — types and small pure helpers only.
 */

/** Lifecycle of a payment request, from creation to a terminal state. */
export type PaymentStatus = "pending" | "authorizing" | "paid" | "failed";

export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "pending",
  "authorizing",
  "paid",
  "failed",
] as const;

export const TERMINAL_STATUSES: readonly PaymentStatus[] = ["paid", "failed"] as const;

export function isTerminalStatus(status: PaymentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Request body for creating a payment request (merchant-authenticated). */
export interface CreatePaymentRequestDto {
  description: string;
  /** Amount in minor units (pence) — integer. The merchant app converts major→minor before sending. */
  amountMinor: number;
  currency?: string;
}

/** Public view of a payment request returned to the customer checkout. */
export interface PaymentRequestPublic {
  paymentId: string;
  merchantName: string;
  description: string;
  /** Amount in minor units (pence). */
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
}

/** Response after creating a payment request, returned to the merchant app. */
export interface CreatePaymentRequestResponse {
  paymentId: string;
  status: PaymentStatus;
  checkoutUrl: string;
}

/** Dashboard summary for the authenticated merchant. */
export interface MerchantSummary {
  takingsTodayMinor: number;
  paidCountToday: number;
  pendingCount: number;
}

/** Request body for registering a new merchant account (creates User + Merchant). */
export interface RegisterRequest {
  email: string;
  password: string;
  merchantName: string;
  /** The merchant's own bank account — funds settle here directly. Encrypted at rest. */
  beneficiaryAccountName: string;
  /** 6-digit UK sort code, no dashes. */
  sortCode: string;
  /** 8-digit UK account number. */
  accountNumber: string;
}

/** Request body for logging in with email + password. */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  merchantId: string;
  merchantName: string;
}

/** WebSocket event emitted when a payment request changes status. */
export interface PaymentUpdatedEvent {
  paymentId: string;
  status: PaymentStatus;
}

export const WS_EVENTS = {
  /** Client → server: subscribe to updates for a given paymentId. */
  SUBSCRIBE: "payment.subscribe",
  /** Server → client: a subscribed payment changed status. */
  UPDATED: "payment.updated",
} as const;
