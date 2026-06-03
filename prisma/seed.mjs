import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    ),
  });

  const sizes = [
    { code: "S", label: "Small", sortOrder: 10 },
    { code: "M", label: "Medium", sortOrder: 20 },
    { code: "L", label: "Large", sortOrder: 30 },
    { code: "XL", label: "X-Large", sortOrder: 40 },
    { code: "XXL", label: "2X-Large", sortOrder: 50 },
    { code: "XXXL", label: "3X-Large", sortOrder: 60 },
    { code: "OneSize", label: "One Size", sortOrder: 70 },
  ];

  for (const s of sizes) {
    await prisma.sizeOption.upsert({
      where: { code: s.code },
      create: { code: s.code, label: s.label, sortOrder: s.sortOrder },
      update: { label: s.label, sortOrder: s.sortOrder, isActive: true },
    });
  }

  // Bootstrap ADMIN credentials for first setup.
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmails.length > 0 && typeof adminPassword === "string" && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    for (const email of adminEmails) {
      await prisma.user.upsert({
        where: { email },
        create: { email, role: "ADMIN", passwordHash, isActive: true },
        update: { role: "ADMIN", passwordHash, isActive: true },
      });
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
