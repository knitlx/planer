import { test, expect } from "@playwright/test";

test.describe("Routines - habits and streaks", () => {
  test("habit creation and streak tracking", async ({ page, request }) => {
    const suffix = Date.now().toString();
    const habitName = `E2E Habit ${suffix}`;
    let habitId: string | null = null;

    try {
      await page.goto("/routines");

      // Create new habit
      await page.getByText("Добавить привычку").click();

      const nameInput = page.getByPlaceholder("Название привычки");
      await expect(nameInput).toBeVisible();
      await nameInput.fill(habitName);
      await page.getByRole("button", { name: "Создать" }).click();

      // Check that habit was created and is visible
      await expect(page.getByText(habitName)).toBeVisible();

      // Check initial streak is 0
      await expect(page.getByText("0").first()).toBeVisible();

      // Toggle habit (mark as completed today)
      const checkbox = page.locator("button").filter({ has: page.locator("svg") }).first();
      await checkbox.click();

      // Check streak became 1
      await expect(page.getByText("1")).toBeVisible();

      // Toggle again (unmark as completed)
      await checkbox.click();

      // Check streak went back to 0
      await expect(page.getByText("0").first()).toBeVisible();

      // Get habit ID for cleanup
      const habitsRes = await request.get("/api/habits");
      expect(habitsRes.ok()).toBeTruthy();
      const habits = (await habitsRes.json()) as Array<{ id: string; name: string }>;
      const habit = habits.find((h) => h.name === habitName);
      habitId = habit?.id ?? null;

    } finally {
      // Cleanup
      if (habitId) {
        await request.delete(`/api/habits/${habitId}`);
      }
    }
  });
});
