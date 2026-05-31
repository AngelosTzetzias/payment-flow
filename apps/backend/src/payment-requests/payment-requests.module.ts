import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { RealtimeModule } from "../realtime/realtime.module.js";
import { PaymentRequestsController } from "./payment-requests.controller.js";
import { PaymentRequestsService } from "./payment-requests.service.js";

@Module({
  imports: [PrismaModule, AuthModule, RealtimeModule],
  controllers: [PaymentRequestsController],
  providers: [PaymentRequestsService],
})
export class PaymentRequestsModule {}
