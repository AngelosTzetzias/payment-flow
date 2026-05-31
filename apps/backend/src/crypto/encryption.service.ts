import { Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;

/**
 * Encrypts merchant bank PII at rest with AES-256-GCM. The 32-byte key comes
 * from `PII_ENCRYPTION_KEY` (64 hex chars, e.g. `openssl rand -hex 32`); a
 * misconfigured key fails fast at boot rather than silently storing garbage.
 *
 * `encrypt` returns one self-describing string `iv.tag.ciphertext` (each part
 * base64) so a single `String` column round-trips without extra schema.
 * Plaintext PII is never logged; only the masked forms are ever returned by
 * the API — see `maskSortCode` / `maskAccountNumber`.
 */
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor() {
    const hexKey = process.env.PII_ENCRYPTION_KEY;
    if (!hexKey) {
      throw new Error("PII_ENCRYPTION_KEY is not set");
    }
    const key = Buffer.from(hexKey, "hex");
    if (key.length !== KEY_BYTES) {
      throw new Error(
        `PII_ENCRYPTION_KEY must be ${KEY_BYTES} bytes (64 hex chars); got ${key.length} bytes`,
      );
    }
    this.key = key;
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(".");
  }

  decrypt(payload: string): string {
    const [ivPart, tagPart, ctPart] = payload.split(".");
    if (!ivPart || !tagPart || !ctPart) {
      throw new Error("Malformed ciphertext payload");
    }
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(ivPart, "base64"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ctPart, "base64")),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  }

  /** Mask a sort code to its last 2 digits, e.g. `040004` -> `**-**-04`. */
  maskSortCode(plain: string): string {
    return `**-**-${plain.slice(-2)}`;
  }

  /** Mask an account number to its last 4 digits, e.g. `00000001` -> `****0001`. */
  maskAccountNumber(plain: string): string {
    return `****${plain.slice(-4)}`;
  }
}
