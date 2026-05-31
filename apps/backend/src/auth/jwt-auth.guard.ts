import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import type { JwtPayload, MerchantPrincipal } from "./merchant-principal.js";

/**
 * Verifies the `Authorization: Bearer <token>` JWT and attaches the merchant
 * principal to the request. A lightweight custom guard — no passport — so the
 * only place that verifies tokens is here.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = header.slice("Bearer ".length);
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
    const principal: MerchantPrincipal = {
      id: payload.merchantId,
      name: payload.merchantName,
      userId: payload.sub,
      email: payload.email,
    };
    (request as Request & { merchant: MerchantPrincipal }).merchant = principal;
    return true;
  }
}
