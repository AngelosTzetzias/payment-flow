import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
  it("reports ok", () => {
    const controller = new HealthController();
    expect(controller.check()).toEqual({ status: "ok", service: "payment-flow-backend" });
  });
});
