import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// DANGER: wipes ALL data and restarts fresh (9 members + this month, unclaimed).
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  await prisma.socialContent.deleteMany();
  await prisma.review.deleteMany();
  await prisma.discussionQuestion.deleteMany();
  await prisma.place.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.dateVote.deleteMany();
  await prisma.dateCandidate.deleteMany();
  await prisma.book.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.user.deleteMany();

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

  console.log(
    `RESET done: ${names.length} members + ${now.getFullYear()}-${now.getMonth() + 1} (host unclaimed). All other data wiped.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
