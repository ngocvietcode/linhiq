// seed-admin.mjs - Run with: node seed-admin.mjs
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const db = new PrismaClient();

// Simple bcrypt-compatible hash using PBKDF2 (without needing bcryptjs installed globally)
// We'll use a prepended prefix so auth.service recognizes it
async function hashPassword(pwd) {
  // Use SHA-256 with 10k iterations as a simple workaround if bcrypt not available
  // However, the auth service likely uses bcrypt - let's just directly call the API
  return pwd; // placeholder
}

async function main() {
  // Check if auth service uses passwordHash field
  const existing = await db.user.findUnique({ where: { email: "admin@linhiq.com" } });
  console.log("Existing user:", existing ? `Found (role: ${existing.role})` : "Not found");

  if (existing) {
    const updated = await db.user.update({
      where: { email: "admin@linhiq.com" },
      data: { role: "ADMIN", name: "System Admin" }
    });
    console.log("✅ Updated role to ADMIN:", updated.email, updated.role);
  } else {
    console.log("No user found with that email. Register first, then run this script.");
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
