import {
  MessageBody,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { WS_EVENTS, type PaymentUpdatedEvent } from "@payment-flow/shared";

/**
 * Pushes payment status changes to subscribed checkout/merchant clients.
 * Dumb transport — the payment-requests service owns the data and calls
 * `emitUpdated`. Clients subscribe per paymentId and only receive updates for
 * payments they joined (room-scoped), so one customer never sees another's.
 */
@WebSocketGateway({ cors: true })
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage(WS_EVENTS.SUBSCRIBE)
  handleSubscribe(
    @MessageBody() data: { paymentId?: unknown },
    @ConnectedSocket() client: Socket,
  ): { subscribed: string } | { error: string } {
    const paymentId = data?.paymentId;
    if (typeof paymentId !== "string" || paymentId.length === 0) {
      return { error: "paymentId is required" };
    }
    void client.join(roomFor(paymentId));
    return { subscribed: paymentId };
  }

  emitUpdated(event: PaymentUpdatedEvent): void {
    this.server?.to(roomFor(event.paymentId)).emit(WS_EVENTS.UPDATED, event);
  }
}

function roomFor(paymentId: string): string {
  return `payment:${paymentId}`;
}
