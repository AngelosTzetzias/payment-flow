import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { MerchantPrincipal } from "./merchant-principal.js";

/** Reads the merchant principal that `JwtAuthGuard` attached to the request. */
export const CurrentMerchant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): MerchantPrincipal => {
    const request = ctx.switchToHttp().getRequest<Request & { merchant: MerchantPrincipal }>();
    return request.merchant;
  },
);
