#!/usr/bin/env node
/*
 * Triggers the /api/reminders/check endpoint. Useful for cron jobs.
 * Set SMART_REMINDERS_BASE_URL to call remote environments, e.g.
 *   SMART_REMINDERS_BASE_URL="https://planer.example.com" node scripts/check-reminders.mjs full
 */

const baseUrl = process.env.SMART_REMINDERS_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000";
const mode = process.argv[2] ?? "full";
const target = new URL("/api/reminders/check", baseUrl);
target.searchParams.set("mode", mode);

async function main() {
  console.log(`[reminders] POST ${target}`);
  try {
    const response = await fetch(target, { method: "POST" });
    const text = await response.text();
    if (!response.ok) {
      console.error("Request failed", response.status, text);
      process.exitCode = 1;
      return;
    }
    try {
      console.log(JSON.parse(text));
    } catch {
      console.log(text);
    }
  } catch (error) {
    console.error("Request error", error);
    process.exitCode = 1;
  }
}

main();
