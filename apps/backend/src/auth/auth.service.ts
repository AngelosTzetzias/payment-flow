import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import type { AuthResponse } from "@payment-flow/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { EncryptionService } from "../crypto/encryption.service.js";
import { TokenService } from "./token.service.js";
import type { RegisterDto } from "./dto/register.dto.js";
import type { LoginDto } from "./dto/login.dto.js";

const BCRYPT_ROUNDS = 10;

/**
 * Owns the email+password auth path. Password hashing (bcryptjs) and bank-PII
 * encryption live here; JWT issuance is delegated to `TokenService` so a future
 * social-login provider can reuse the same token seam.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly tokens: TokenService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.prisma.client.user.create({
        data: {
          email: dto.email,
          passwordHash,
          merchants: {
            create: {
              name: dto.merchantName,
              beneficiaryAccountName: this.encryption.encrypt(dto.beneficiaryAccountName),
              sortCode: this.encryption.encrypt(dto.sortCode),
              accountNumber: this.encryption.encrypt(dto.accountNumber),
            },
          },
        },
        include: { merchants: true },
      });
      const merchant = user.merchants[0];
      return this.tokens.issueFor({
        userId: user.id,
        email: user.email,
        merchantId: merchant.id,
        merchantName: merchant.name,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException("Email already registered");
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
      include: { merchants: true },
    });
    // Same error for unknown email and wrong password — don't leak which.
    const merchant = user?.merchants[0];
    if (!user || !merchant || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.tokens.issueFor({
      userId: user.id,
      email: user.email,
      merchantId: merchant.id,
      merchantName: merchant.name,
    });
  }
}

/** Prisma raises P2002 on a unique-constraint violation (here: duplicate email). */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}
