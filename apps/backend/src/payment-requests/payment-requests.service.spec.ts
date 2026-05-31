import { jest } from "@jest/globals";
import { ConflictException, Logger, NotFoundException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { PaymentStatus } from "@payment-flow/shared";
import { PaymentRequestsService } from "./payment-requests.service.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import type { RealtimeGateway } from "../realtime/realtime.gateway.js";
import type { CreatePaymentRequestDto } from "./dto/create-payment-request.dto.js";

const SETTLE_DELAY = 2000;

describe("PaymentRequestsService", () => {
  let paymentClient: {
    create: jest.Mock<(args: unknown) => Promise<unknown>>;
    findUnique: jest.Mock<(args: unknown) => Promise<unknown>>;
    findFirst: jest.Mock<(args: unknown) => Promise<unknown>>;
    updateMany: jest.Mock<(args: unknown) => Promise<{ count: number }>>;
  };
  let emitUpdated: jest.Mock<(event: unknown) => void>;
  let service: PaymentRequestsService;

  beforeEach(() => {
    paymentClient = {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(async () => ({ count: 1 })),
    };
    emitUpdated = jest.fn();
    const prisma = { client: { paymentRequest: paymentClient } } as unknown as PrismaService;
    const gateway = { emitUpdated } as unknown as RealtimeGateway;
    const config = {
      get: (key: string) =>
        key === "CHECKOUT_BASE_URL"
          ? "https://pay.example.com"
          : key === "MOCK_SETTLE_DELAY_MS"
            ? String(SETTLE_DELAY)
            : undefined,
    } as unknown as ConfigService;
    service = new PaymentRequestsService(prisma, gateway, config);
  });

  describe("create", () => {
    it("persists the request and builds the checkout URL", async () => {
      paymentClient.create.mockResolvedValue({ id: "p1", status: "pending" });
      const dto: CreatePaymentRequestDto = { description: "Haircut", amountMinor: 1500 };

      const result = await service.create("m1", dto);

      expect(result).toEqual({
        paymentId: "p1",
        status: "pending",
        checkoutUrl: "https://pay.example.com/p/p1",
      });
      const data = (paymentClient.create.mock.calls[0][0] as { data: { currency: string } }).data;
      expect(data.currency).toBe("GBP");
    });
  });

  describe("getPublic", () => {
    it("maps the merchant name and omits PII", async () => {
      paymentClient.findUnique.mockResolvedValue({
        id: "p1",
        description: "Haircut",
        amountMinor: 1500,
        currency: "GBP",
        status: "pending",
        merchant: { name: "Joe's Barber" },
      });

      const result = await service.getPublic("p1");

      expect(result).toEqual({
        paymentId: "p1",
        merchantName: "Joe's Barber",
        description: "Haircut",
        amountMinor: 1500,
        currency: "GBP",
        status: "pending",
      });
    });

    it("throws NotFound when the payment is missing", async () => {
      paymentClient.findUnique.mockResolvedValue(null);
      await expect(service.getPublic("missing")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("getPendingForMerchant", () => {
    it("throws NotFound when nothing is pending", async () => {
      paymentClient.findFirst.mockResolvedValue(null);
      await expect(service.getPendingForMerchant("m1")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("pay (mock timed settlement)", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("advances pending -> authorizing -> paid, emitting each step", async () => {
      paymentClient.findUnique.mockResolvedValue({ id: "p1", status: "pending" });

      const result = await service.pay("p1");

      // Immediate transition + response.
      expect(result).toEqual({ paymentId: "p1", status: "authorizing" });
      expect(emitUpdated).toHaveBeenNthCalledWith(1, { paymentId: "p1", status: "authorizing" });

      // Drive the scheduled settlement (Async variant flushes the awaited update).
      await jest.advanceTimersByTimeAsync(SETTLE_DELAY);

      expect(emitUpdated).toHaveBeenNthCalledWith(2, { paymentId: "p1", status: "paid" });
      // The paid transition stamps paidAt.
      const paidUpdate = paymentClient.updateMany.mock.calls.find(
        (c) => (c[0] as { data: { status: PaymentStatus } }).data.status === "paid",
      );
      expect((paidUpdate?.[0] as { data: { paidAt?: Date } }).data.paidAt).toBeInstanceOf(Date);
    });

    it("rejects a request that already reached a terminal state", async () => {
      paymentClient.findUnique.mockResolvedValue({ id: "p1", status: "paid" });
      await expect(service.pay("p1")).rejects.toBeInstanceOf(ConflictException);
      expect(emitUpdated).not.toHaveBeenCalled();
    });

    it("is idempotent when already authorizing", async () => {
      paymentClient.findUnique.mockResolvedValue({ id: "p1", status: "authorizing" });
      const result = await service.pay("p1");
      expect(result).toEqual({ paymentId: "p1", status: "authorizing" });
      expect(paymentClient.updateMany).not.toHaveBeenCalled();
      expect(emitUpdated).not.toHaveBeenCalled();
    });

    it("transitions to failed if settlement errors", async () => {
      jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
      paymentClient.findUnique.mockResolvedValue({ id: "p1", status: "pending" });
      // First updateMany (authorizing) succeeds; the paid one rejects.
      paymentClient.updateMany
        .mockImplementationOnce(async () => ({ count: 1 }))
        .mockImplementationOnce(async () => {
          throw new Error("db down");
        })
        .mockImplementationOnce(async () => ({ count: 1 }));

      await service.pay("p1");
      await jest.advanceTimersByTimeAsync(SETTLE_DELAY);

      expect(emitUpdated).toHaveBeenNthCalledWith(2, { paymentId: "p1", status: "failed" });
    });
  });
});
