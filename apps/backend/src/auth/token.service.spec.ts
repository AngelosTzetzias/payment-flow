import { JwtService } from "@nestjs/jwt";
import { TokenService } from "./token.service.js";
import type { JwtPayload } from "./merchant-principal.js";

describe("TokenService", () => {
  const jwt = new JwtService({ secret: "test-secret", signOptions: { expiresIn: "7d" } });
  const service = new TokenService(jwt);

  it("issues a signed token whose claims describe the merchant principal", async () => {
    const result = await service.issueFor({
      userId: "u1",
      email: "joe@example.com",
      merchantId: "m1",
      merchantName: "Joe's Barber",
    });

    expect(result).toEqual({
      accessToken: expect.any(String),
      merchantId: "m1",
      merchantName: "Joe's Barber",
    });

    const decoded = await jwt.verifyAsync<JwtPayload>(result.accessToken);
    expect(decoded.sub).toBe("u1");
    expect(decoded.merchantId).toBe("m1");
    expect(decoded.merchantName).toBe("Joe's Barber");
    expect(decoded.email).toBe("joe@example.com");
  });
});
