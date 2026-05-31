/**
 * Seeds a demo merchant/user for local development.
 * Stage 1 wires real auth: the password is bcrypt-hashed and the merchant's
 * bank PII is AES-256-GCM encrypted via the same EncryptionService the app
 * uses. Requires PII_ENCRYPTION_KEY (and DATABASE_URL) in .env.
 *
 * Dev credentials: joe@example.com / password123 (local only — not a real secret).
 */
import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { EncryptionService } from "../src/crypto/encryption.service.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const DEV_PASSWORD = "password123";

async function main() {
  const encryption = new EncryptionService();
  const passwordHash = await hash(DEV_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: "joe@example.com" },
    update: {},
    create: {
      email: "joe@example.com",
      passwordHash,
      merchants: {
        create: {
          name: "Joe's Barber",
          beneficiaryAccountName: encryption.encrypt("Joe's Barber Ltd"),
          sortCode: encryption.encrypt("040004"),
          accountNumber: encryption.encrypt("00000001"),
        },
      },
    },
    include: { merchants: true },
  });

  console.log(`Seeded user ${user.email} with merchant ${user.merchants[0]?.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
