import { jest } from "@jest/globals";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import type { AuthResponse } from "@payment-flow/shared";
import { compare, hash } from "bcryptjs";
import { AuthService } from "./auth.service.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import type { EncryptionService } from "../crypto/encryption.service.js";
import type { TokenService } from "./token.service.js";
import type { RegisterDto } from "./dto/register.dto.js";
import type { LoginDto } from "./dto/login.dto.js";

const registerDto: RegisterDto = {
  email: "joe@example.com",
  password: "supersecret",
  merchantName: "Joe's Barber",
  beneficiaryAccountName: "Joe's Barber Ltd",
  sortCode: "040004",
  accountNumber: "00000001",
};

describe("AuthService", () => {
  let userClient: {
    create: jest.Mock<(args: unknown) => Promise<unknown>>;
    findUnique: jest.Mock<(args: unknown) => Promise<unknown>>;
  };
  let prisma: PrismaService;
  let encrypt: jest.Mock<(v: string) => string>;
  let issueFor: jest.Mock<(input: unknown) => Promise<AuthResponse>>;
  let service: AuthService;

  beforeEach(() => {
    userClient = { create: jest.fn(), findUnique: jest.fn() };
    prisma = { client: { user: userClient } } as unknown as PrismaService;
    encrypt = jest.fn((v: string) => `enc(${v})`);
    issueFor = jest.fn(async () => ({
      accessToken: "jwt",
      merchantId: "m1",
      merchantName: "Joe's Barber",
    }));
    service = new AuthService(
      prisma,
      { encrypt } as unknown as EncryptionService,
      { issueFor } as unknown as TokenService,
    );
  });

  describe("register", () => {
    it("hashes the password, encrypts PII, and issues a token", async () => {
      userClient.create.mockResolvedValue({
        id: "u1",
        email: registerDto.email,
        merchants: [{ id: "m1", name: registerDto.merchantName }],
      });

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe("jwt");
      const data = (
        userClient.create.mock.calls[0][0] as {
          data: {
            passwordHash: string;
            merchants: { create: { sortCode: string } };
          };
        }
      ).data;
      // Password is hashed, never stored raw.
      expect(data.passwordHash).not.toBe(registerDto.password);
      expect(await compare(registerDto.password, data.passwordHash)).toBe(true);
      // All three PII fields go through the encryption service.
      const merchant = data.merchants.create;
      expect(encrypt).toHaveBeenCalledWith(registerDto.beneficiaryAccountName);
      expect(encrypt).toHaveBeenCalledWith(registerDto.sortCode);
      expect(encrypt).toHaveBeenCalledWith(registerDto.accountNumber);
      expect(merchant.sortCode).toBe("enc(040004)");
      expect(issueFor).toHaveBeenCalledWith({
        userId: "u1",
        email: registerDto.email,
        merchantId: "m1",
        merchantName: registerDto.merchantName,
      });
    });

    it("maps a duplicate-email constraint to ConflictException", async () => {
      userClient.create.mockRejectedValue({ code: "P2002" });
      await expect(service.register(registerDto)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = { email: "joe@example.com", password: "supersecret" };

    it("issues a token for valid credentials", async () => {
      userClient.findUnique.mockResolvedValue({
        id: "u1",
        email: loginDto.email,
        passwordHash: await hash(loginDto.password, 10),
        merchants: [{ id: "m1", name: "Joe's Barber" }],
      });

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe("jwt");
      expect(issueFor).toHaveBeenCalled();
    });

    it("rejects an unknown email", async () => {
      userClient.findUnique.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(issueFor).not.toHaveBeenCalled();
    });

    it("rejects a wrong password", async () => {
      userClient.findUnique.mockResolvedValue({
        id: "u1",
        email: loginDto.email,
        passwordHash: await hash("a-different-password", 10),
        merchants: [{ id: "m1", name: "Joe's Barber" }],
      });
      await expect(service.login(loginDto)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(issueFor).not.toHaveBeenCalled();
    });
  });
});
