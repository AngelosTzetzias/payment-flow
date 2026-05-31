import { jest } from "@jest/globals";
import { PaymentRequestsController } from "./payment-requests.controller.js";
import type { PaymentRequestsService } from "./payment-requests.service.js";
import type { MerchantPrincipal } from "../auth/merchant-principal.js";
import type { CreatePaymentRequestDto } from "./dto/create-payment-request.dto.js";

describe("PaymentRequestsController", () => {
  let create: jest.Mock<(merchantId: string, dto: CreatePaymentRequestDto) => Promise<unknown>>;
  let controller: PaymentRequestsController;

  beforeEach(() => {
    create = jest.fn(async () => ({
      paymentId: "p1",
      status: "pending",
      checkoutUrl: "https://pay.example.com/p/p1",
    }));
    const service = { create } as unknown as PaymentRequestsService;
    controller = new PaymentRequestsController(service);
  });

  it("creates using the merchant id from the principal, never the body", async () => {
    const merchant: MerchantPrincipal = {
      id: "merchant-from-jwt",
      name: "Joe's Barber",
      userId: "u1",
      email: "joe@example.com",
    };
    const dto: CreatePaymentRequestDto = { description: "Haircut", amountMinor: 1500 };

    await controller.create(merchant, dto);

    expect(create).toHaveBeenCalledWith("merchant-from-jwt", dto);
  });
});
