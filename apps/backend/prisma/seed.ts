/**
 * Seeds a demo merchant/user for local development.
 * Password hashing uses a placeholder here; Stage 1 introduces bcrypt + the
 * real auth module, at which point this seed switches to a proper hash.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "joe@example.com" },
    update: {},
    create: {
      email: "joe@example.com",
      // Placeholder until Stage 1 wires bcrypt; not a real credential.
      passwordHash: "seed-placeholder",
      merchants: {
        create: {
          name: "Joe's Barber",
          beneficiaryAccountName: "Joe's Barber Ltd",
          sortCode: "040004",
          accountNumber: "00000001",
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
