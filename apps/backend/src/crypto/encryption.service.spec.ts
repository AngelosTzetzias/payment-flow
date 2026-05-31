import { EncryptionService } from "./encryption.service.js";

// 32-byte key (64 hex chars) used only for these tests.
const TEST_KEY = "0".repeat(64);

describe("EncryptionService", () => {
  let service: EncryptionService;

  beforeAll(() => {
    process.env.PII_ENCRYPTION_KEY = TEST_KEY;
    service = new EncryptionService();
  });

  it("round-trips a value through encrypt/decrypt", () => {
    const plain = "Joe's Barber Ltd";
    const encrypted = service.encrypt(plain);
    expect(encrypted).not.toContain(plain);
    expect(service.decrypt(encrypted)).toBe(plain);
  });

  it("uses a fresh IV per call so identical inputs encrypt differently", () => {
    const a = service.encrypt("same");
    const b = service.encrypt("same");
    expect(a).not.toBe(b);
    expect(service.decrypt(a)).toBe("same");
    expect(service.decrypt(b)).toBe("same");
  });

  it("rejects tampered ciphertext (GCM auth failure)", () => {
    const encrypted = service.encrypt("sensitive");
    const [iv, tag, ct] = encrypted.split(".");
    // Flip a byte in the ciphertext.
    const tamperedCt = Buffer.from(ct, "base64");
    tamperedCt[0] ^= 0x01;
    const tampered = [iv, tag, tamperedCt.toString("base64")].join(".");
    expect(() => service.decrypt(tampered)).toThrow();
  });

  it("rejects a malformed payload", () => {
    expect(() => service.decrypt("not-a-valid-payload")).toThrow("Malformed ciphertext payload");
  });

  it("masks a sort code to the last two digits", () => {
    expect(service.maskSortCode("040004")).toBe("**-**-04");
  });

  it("masks an account number to the last four digits", () => {
    expect(service.maskAccountNumber("00000001")).toBe("****0001");
  });

  it("throws when the key is not 32 bytes", () => {
    const original = process.env.PII_ENCRYPTION_KEY;
    process.env.PII_ENCRYPTION_KEY = "abcd"; // 2 bytes
    expect(() => new EncryptionService()).toThrow(/32 bytes/);
    process.env.PII_ENCRYPTION_KEY = original;
  });

  it("throws when the key is missing", () => {
    const original = process.env.PII_ENCRYPTION_KEY;
    delete process.env.PII_ENCRYPTION_KEY;
    expect(() => new EncryptionService()).toThrow(/not set/);
    process.env.PII_ENCRYPTION_KEY = original;
  });
});
