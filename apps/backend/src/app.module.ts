import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module.js";
import { CryptoModule } from "./crypto/crypto.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { RealtimeModule } from "./realtime/realtime.module.js";
import { HealthController } from "./health/health.controller.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CryptoModule,
    AuthModule,
    RealtimeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
