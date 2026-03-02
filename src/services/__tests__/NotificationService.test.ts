import { NotificationService } from "../NotificationService";

describe("NotificationService", () => {
  describe("processAll", () => {
    it("processes all notification events without throwing", async () => {
      await expect(NotificationService.processAll()).resolves.not.toThrow();
    });
  });
});
