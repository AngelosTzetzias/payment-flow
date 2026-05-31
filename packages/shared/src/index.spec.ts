import { PAYMENT_STATUSES, TERMINAL_STATUSES, WS_EVENTS, isTerminalStatus } from "./index";

describe("payment status contract", () => {
  it("treats paid and failed as terminal", () => {
    expect(isTerminalStatus("paid")).toBe(true);
    expect(isTerminalStatus("failed")).toBe(true);
  });

  it("treats pending and authorizing as non-terminal", () => {
    expect(isTerminalStatus("pending")).toBe(false);
    expect(isTerminalStatus("authorizing")).toBe(false);
  });

  it("keeps TERMINAL_STATUSES a subset of PAYMENT_STATUSES", () => {
    for (const status of TERMINAL_STATUSES) {
      expect(PAYMENT_STATUSES).toContain(status);
    }
  });

  it("forces every declared status to be classified by isTerminalStatus", () => {
    for (const status of PAYMENT_STATUSES) {
      expect(isTerminalStatus(status)).toBe(TERMINAL_STATUSES.includes(status));
    }
  });
});

describe("WS_EVENTS", () => {
  it("pins the wire strings the gateway and clients subscribe to", () => {
    expect(WS_EVENTS.SUBSCRIBE).toBe("payment.subscribe");
    expect(WS_EVENTS.UPDATED).toBe("payment.updated");
  });
});
