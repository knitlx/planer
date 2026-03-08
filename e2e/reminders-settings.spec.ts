import { test, expect } from "@playwright/test";

test.describe("Reminders settings", () => {
  test("user toggles mandatory trigger", async ({ page, request }) => {
    const triggersResponse = await request.get("/api/reminders/triggers");
    expect(triggersResponse.ok()).toBeTruthy();
    const triggers = (await triggersResponse.json()) as Array<{
      id: string;
      type: string;
      enabled: boolean;
    }>;
    const staleTrigger = triggers.find((trigger) => trigger.type === "MANDATORY_STALE");
    expect(staleTrigger).toBeDefined();
    if (!staleTrigger) return; // для тайпскрипта

    const revertPayload = { id: staleTrigger.id, enabled: staleTrigger.enabled };

    await page.goto("/reminders");
    await page.getByRole("button", { name: "Настройки триггеров" }).click();

    const toggle = page.getByTestId("trigger-mandatory_stale");
    await toggle.click();
    await expect(page.getByText("Настройки сохранены")).toBeVisible();

    await expect.poll(async () => {
      const verifyResponse = await request.get("/api/reminders/triggers");
      const current = (await verifyResponse.json()) as Array<{ id: string; enabled: boolean }>;
      return current.find((trigger) => trigger.id === staleTrigger.id)?.enabled;
    }).toBe(!staleTrigger.enabled);

    await request.put("/api/reminders/triggers", {
      data: revertPayload,
      headers: { "Content-Type": "application/json" },
    });
  });
});
