import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module.js";
import { CryptoModule } from "./crypto/crypto.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { HealthController } from "./health/health.controller.js";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, CryptoModule, AuthModule],
  controllers: [HealthController],
})
export class AppModule {}
