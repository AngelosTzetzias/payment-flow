import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

/**
 * Wraps the Prisma 7 client. The Rust-free `prisma-client` generator exports
 * `PrismaClient` as an interface + constructor (not a class), so it can no
 * longer be subclassed — `extends PrismaClient` loses the model accessors and
 * `$connect`/`$disconnect`. We compose instead and expose `.client`; services
 * query via `prismaService.client.<model>`.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: PrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    // Prisma 7 connects through the pg driver adapter rather than a URL on the
    // datasource block (which now lives in prisma.config.ts).
    this.client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
