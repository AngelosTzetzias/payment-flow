import { jest } from "@jest/globals";
import type { Server, Socket } from "socket.io";
import { WS_EVENTS } from "@payment-flow/shared";
import { RealtimeGateway } from "./realtime.gateway.js";

describe("RealtimeGateway", () => {
  let gateway: RealtimeGateway;

  beforeEach(() => {
    gateway = new RealtimeGateway();
  });

  describe("handleSubscribe", () => {
    it("joins the payment room for a valid paymentId", () => {
      const join = jest.fn();
      const client = { join } as unknown as Socket;
      const result = gateway.handleSubscribe({ paymentId: "p1" }, client);
      expect(join).toHaveBeenCalledWith("payment:p1");
      expect(result).toEqual({ subscribed: "p1" });
    });

    it("rejects a missing/invalid paymentId without joining", () => {
      const join = jest.fn();
      const client = { join } as unknown as Socket;
      const result = gateway.handleSubscribe({}, client);
      expect(join).not.toHaveBeenCalled();
      expect(result).toEqual({ error: "paymentId is required" });
    });
  });

  describe("emitUpdated", () => {
    it("emits the update to the payment's room", () => {
      const emit = jest.fn();
      const to = jest.fn(() => ({ emit }));
      gateway.server = { to } as unknown as Server;

      gateway.emitUpdated({ paymentId: "p1", status: "paid" });

      expect(to).toHaveBeenCalledWith("payment:p1");
      expect(emit).toHaveBeenCalledWith(WS_EVENTS.UPDATED, { paymentId: "p1", status: "paid" });
    });
  });
});
