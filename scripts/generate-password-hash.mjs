#!/usr/bin/env node
/**
 * Script to generate password hash for ADMIN_PASSWORD_HASH env variable
 * Usage: node scripts/generate-password-hash.js [password]
 * If no password provided, generates a random one
 */

import bcrypt from "bcryptjs";

async function main() {
  const args = process.argv.slice(2);
  let password = args[0];

  if (!password) {
    // Generate random password
    password = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    console.log("\nGenerated random password:", password);
  }

  const hash = await bcrypt.hash(password, 12);
  const base64Hash = Buffer.from(hash).toString("base64");

  console.log("\nAdd this to your .env file:");
  console.log("================================");
  console.log(`ADMIN_PASSWORD_HASH=base64:${base64Hash}`);
  console.log("================================\n");

  if (!args[0]) {
    console.log("⚠️  Save this password somewhere safe! You won't see it again.");
    console.log("   Or provide your own password: node scripts/generate-password-hash.js yourpassword\n");
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
