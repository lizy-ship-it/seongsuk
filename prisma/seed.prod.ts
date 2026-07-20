import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Production seed: the 9 real members + this month's meeting (host unclaimed).
// Idempotent — does nothing if members already exist.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log(`Skip: ${existing} members already exist.`);
    return;
  }

  const names = [
    "의부찌",
    "ripple",
    "Rachel",
    "eea",
    "beenie",
    "FED",
    "BMO",
    "아이셔",
    "용용",
  ];
  await prisma.user.createMany({
    data: names.map((n) => ({ name: n, nickname: n })),
  });

  const now = new Date();
  await prisma.meeting.create({
    data: {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      status: "BOOK_SELECTION",
    },
  });

  console.log(`Seeded ${names.length} members + ${now.getFullYear()}-${now.getMonth() + 1} (host unclaimed).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
