import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  // Authenticated API request context
  request: async ({ request }, provide) => {
    // Login via API to get session cookie
    const loginResponse = await request.post("/api/auth/login", {
      data: { password: "admin" }
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    
    // Use authenticated request
    await provide(request);
  }
});

export { expect };
