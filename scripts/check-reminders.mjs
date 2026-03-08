#!/usr/bin/env node
/*
 * Triggers the /api/reminders/check endpoint. Useful for cron jobs.
 * Set REMINDERS_CHECK_URL to call remote environments, e.g.
 *   REMINDERS_CHECK_URL="https://planer.example.com/api/reminders/check" npm run reminders:check
 */

const target = process.env.REMINDERS_CHECK_URL || "http://localhost:3000/api/reminders/check";

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
    console.log(text);
  } catch (error) {
    console.error("Request error", error);
    process.exitCode = 1;
  }
}

main();
