import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  isTerminalStatus,
  type CreatePaymentRequestResponse,
  type PaymentRequestPublic,
  type PaymentStatus,
  type PaymentUpdatedEvent,
} from "@payment-flow/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { RealtimeGateway } from "../realtime/realtime.gateway.js";
import type { CreatePaymentRequestDto } from "./dto/create-payment-request.dto.js";

const DEFAULT_SETTLE_DELAY_MS = 2000;

/**
 * Owns the payment-request lifecycle. Stage 1 settles with *mock* money: a
 * `pay` call walks pending -> authorizing -> paid over a short delay, emitting
 * a WebSocket event at each step (Stage 2 replaces this with real TrueLayer
 * PIS + webhook). Every transition is guarded so it can't double-advance.
 */
@Injectable()
export class PaymentRequestsService {
  private readonly logger = new Logger(PaymentRequestsService.name);
  private readonly checkoutBaseUrl: string;
  private readonly settleDelayMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: RealtimeGateway,
    config: ConfigService,
  ) {
    this.checkoutBaseUrl = config.get<string>("CHECKOUT_BASE_URL") ?? "http://localhost:3000";
    this.settleDelayMs = Number(
      config.get<string>("MOCK_SETTLE_DELAY_MS") ?? DEFAULT_SETTLE_DELAY_MS,
    );
  }

  async create(
    merchantId: string,
    dto: CreatePaymentRequestDto,
  ): Promise<CreatePaymentRequestResponse> {
    const payment = await this.prisma.client.paymentRequest.create({
      data: {
        merchantId,
        description: dto.description,
        amountMinor: dto.amountMinor,
        currency: dto.currency ?? "GBP",
      },
    });
    return {
      paymentId: payment.id,
      status: payment.status,
      checkoutUrl: `${this.checkoutBaseUrl}/p/${payment.id}`,
    };
  }

  async getPublic(paymentId: string): Promise<PaymentRequestPublic> {
    const payment = await this.prisma.client.paymentRequest.findUnique({
      where: { id: paymentId },
      // Never select bank PII — only the customer-facing fields.
      select: {
        id: true,
        description: true,
        amountMinor: true,
        currency: true,
        status: true,
        merchant: { select: { name: true } },
      },
    });
    if (!payment) {
      throw new NotFoundException("Payment request not found");
    }
    return toPublic(payment);
  }

  async getPendingForMerchant(merchantId: string): Promise<PaymentRequestPublic> {
    const payment = await this.prisma.client.paymentRequest.findFirst({
      where: { merchantId, status: "pending" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        description: true,
        amountMinor: true,
        currency: true,
        status: true,
        merchant: { select: { name: true } },
      },
    });
    if (!payment) {
      throw new NotFoundException("No pending payment for this merchant");
    }
    return toPublic(payment);
  }

  /**
   * Customer "Pay by Bank". Moves pending -> authorizing immediately (so the
   * HTTP response is fast) then schedules the authorizing -> paid step; the
   * client learns about it over WebSocket. Idempotent on re-entry; rejects a
   * request that has already reached a terminal state.
   */
  async pay(paymentId: string): Promise<PaymentUpdatedEvent> {
    const payment = await this.prisma.client.paymentRequest.findUnique({
      where: { id: paymentId },
      select: { id: true, status: true },
    });
    if (!payment) {
      throw new NotFoundException("Payment request not found");
    }
    if (isTerminalStatus(payment.status)) {
      throw new ConflictException(`Payment already ${payment.status}`);
    }
    if (payment.status === "authorizing") {
      return { paymentId, status: "authorizing" };
    }

    await this.transition(paymentId, "pending", "authorizing");
    this.scheduleSettlement(paymentId);
    return { paymentId, status: "authorizing" };
  }

  private scheduleSettlement(paymentId: string): void {
    // Mock-only in-process timer: an `authorizing` row has no recovery path if
    // the process restarts before it fires. Acceptable for Stage 1 — Stage 2's
    // signature-verified webhook (+ poll fallback) replaces this entirely.
    setTimeout(() => {
      void this.settle(paymentId);
    }, this.settleDelayMs);
  }

  private async settle(paymentId: string): Promise<void> {
    try {
      await this.transition(paymentId, "authorizing", "paid");
    } catch (error) {
      // The guarded transition is safe here: if `paid` already persisted, the
      // `failed` updateMany no-ops (row no longer `authorizing`). In Stage 2 the
      // "mark failed" path must NOT run after a confirmed real settlement.
      this.logger.error(`Mock settlement failed for ${paymentId}`, error as Error);
      await this.transition(paymentId, "authorizing", "failed").catch(() => undefined);
    }
  }

  /**
   * Guarded transition: only advances when the row is still in `from`, so
   * concurrent calls can't double-advance. Emits the new status on success.
   */
  private async transition(
    paymentId: string,
    from: PaymentStatus,
    to: PaymentStatus,
  ): Promise<boolean> {
    const result = await this.prisma.client.paymentRequest.updateMany({
      where: { id: paymentId, status: from },
      data: { status: to, ...(to === "paid" ? { paidAt: new Date() } : {}) },
    });
    if (result.count === 0) {
      return false;
    }
    this.gateway.emitUpdated({ paymentId, status: to });
    return true;
  }
}

function toPublic(payment: {
  id: string;
  description: string;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  merchant: { name: string };
}): PaymentRequestPublic {
  return {
    paymentId: payment.id,
    merchantName: payment.merchant.name,
    description: payment.description,
    amountMinor: payment.amountMinor,
    currency: payment.currency,
    status: payment.status,
  };
}
