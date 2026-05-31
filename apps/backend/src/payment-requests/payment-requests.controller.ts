import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type {
  CreatePaymentRequestResponse,
  PaymentRequestPublic,
  PaymentUpdatedEvent,
} from "@payment-flow/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentMerchant } from "../auth/current-merchant.decorator.js";
import type { MerchantPrincipal } from "../auth/merchant-principal.js";
import { PaymentRequestsService } from "./payment-requests.service.js";
import { CreatePaymentRequestDto } from "./dto/create-payment-request.dto.js";

@Controller()
export class PaymentRequestsController {
  constructor(private readonly service: PaymentRequestsService) {}

  /** Merchant-authenticated: create a payment request for the authed merchant. */
  @UseGuards(JwtAuthGuard)
  @Post("payment-requests")
  create(
    @CurrentMerchant() merchant: MerchantPrincipal,
    @Body() dto: CreatePaymentRequestDto,
  ): Promise<CreatePaymentRequestResponse> {
    return this.service.create(merchant.id, dto);
  }

  /** Public: the checkout fetches a payment request by id (`/p/:id`). */
  @Get("payment-requests/:paymentId")
  getPublic(@Param("paymentId") paymentId: string): Promise<PaymentRequestPublic> {
    return this.service.getPublic(paymentId);
  }

  /** Public: resolve a merchant's currently-pending request (`/m/:merchantId`). */
  @Get("merchants/:merchantId/pending-payment")
  getPending(@Param("merchantId") merchantId: string): Promise<PaymentRequestPublic> {
    return this.service.getPendingForMerchant(merchantId);
  }

  /** Public: the customer's "Pay by Bank" — kicks off mock settlement. */
  @Post("payment-requests/:paymentId/pay")
  pay(@Param("paymentId") paymentId: string): Promise<PaymentUpdatedEvent> {
    return this.service.pay(paymentId);
  }
}
