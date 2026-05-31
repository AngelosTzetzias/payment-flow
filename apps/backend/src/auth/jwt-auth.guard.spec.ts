import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import type { JwtPayload, MerchantPrincipal } from "./merchant-principal.js";

const jwt = new JwtService({ secret: "test-secret" });

function contextFor(headers: Record<string, string>): {
  ctx: ExecutionContext;
  request: { headers: Record<string, string>; merchant?: MerchantPrincipal };
} {
  const request: { headers: Record<string, string>; merchant?: MerchantPrincipal } = { headers };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { ctx, request };
}

describe("JwtAuthGuard", () => {
  const guard = new JwtAuthGuard(jwt);

  it("attaches the merchant principal for a valid bearer token", async () => {
    const payload: JwtPayload = {
      sub: "u1",
      merchantId: "m1",
      merchantName: "Joe's Barber",
      email: "joe@example.com",
    };
    const token = await jwt.signAsync(payload);
    const { ctx, request } = contextFor({ authorization: `Bearer ${token}` });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.merchant).toEqual({
      id: "m1",
      name: "Joe's Barber",
      userId: "u1",
      email: "joe@example.com",
    });
  });

  it("rejects a missing authorization header", async () => {
    const { ctx } = contextFor({});
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a malformed/invalid token", async () => {
    const { ctx } = contextFor({ authorization: "Bearer not-a-real-token" });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
