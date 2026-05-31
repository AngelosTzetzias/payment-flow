import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AuthResponse } from "@payment-flow/shared";
import type { JwtPayload } from "./merchant-principal.js";

/**
 * Centralises JWT issuance. This is the seam every auth path funnels through:
 * the email+password path today, and a future social-login provider can call
 * `issueFor` after resolving-or-creating its own User + Merchant — the claim
 * shape and `AuthResponse` stay defined in exactly one place.
 */
@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async issueFor(input: {
    userId: string;
    email: string;
    merchantId: string;
    merchantName: string;
  }): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: input.userId,
      merchantId: input.merchantId,
      merchantName: input.merchantName,
      email: input.email,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      merchantId: input.merchantId,
      merchantName: input.merchantName,
    };
  }
}
