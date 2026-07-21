import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Adds ONE example completed meeting (June 2026) with attendance + reviews,
// so 참석 현황 / 기록 / 리뷰 이미지를 미리 볼 수 있다. Additive (no wipe).
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const kst = (iso: string) => new Date(`${iso}+09:00`);

async function main() {
  const users = await prisma.user.findMany();
  const by = Object.fromEntries(users.map((u) => [u.nickname, u]));

  const existing = await prisma.meeting.findFirst({
    where: { year: 2026, month: 6 },
  });
  if (existing) {
    console.log("June demo already exists — skipping.");
    return;
  }

  const june = await prisma.meeting.create({
    data: {
      year: 2026,
      month: 6,
      status: "COMPLETE",
      hostId: by.ripple.id,
      confirmedDate: kst("2026-06-21T15:00:00"),
      book: {
        create: { title: "불안의 서", author: "페르난두 페소아" },
      },
      place: {
        create: {
          name: "연남동 코너스터디룸",
          address: "서울특별시 마포구 동교로 235 2층",
          link: "https://map.naver.com/p/search/연남동 코너스터디룸",
          datetime: kst("2026-06-21T15:00:00"),
          cost: 40000,
          reserved: true,
        },
      },
      discussionQuestions: {
        create: [
          { order: 1, content: "가장 인상 깊었던 문장은?" },
          { order: 2, content: "저자의 불안을 어떻게 이해했나요?" },
          { order: 3, content: "가장 이야기해보고 싶은 부분은?" },
        ],
      },
    },
  });

  const attendance: Record<string, string[]> = {
    ATTENDING: ["ripple", "Rachel", "eea", "beenie", "BMO"],
    NOT_ATTENDING: ["FED", "아이셔"],
    NO_RESPONSE: ["용용", "의부찌"],
  };
  for (const [status, nicks] of Object.entries(attendance)) {
    for (const nick of nicks) {
      await prisma.attendance.create({
        data: { meetingId: june.id, userId: by[nick].id, status },
      });
    }
  }

  const reviews: Array<[string, number, string]> = [
    ["ripple", 4, "숨겨두었던 나의 못난 마음들을 나열해둔 책"],
    ["Rachel", 3, "평범한 '안녕'이라는 말이 이렇게 깊은 의미를 담고 있다는 걸 다시 생각하게 만든 책"],
    ["eea", 4, "내면의 추악함이나 모순적인 모습이 공감 가면서도 화가 나고 부끄럽게도 만든 책"],
    ["beenie", 5, "밑줄이 남아나질 않았다"],
    ["BMO", 3, "조금 어려웠지만 대화 나누며 이해가 깊어졌다"],
  ];
  for (const [nick, rating, comment] of reviews) {
    await prisma.review.create({
      data: {
        meetingId: june.id,
        userId: by[nick].id,
        rating,
        comment,
        readBook: true,
        attended: attendance.ATTENDING.includes(nick),
        snsConsent: true,
      },
    });
  }

  console.log("Demo June 2026 (COMPLETE) created: book + 9 attendance + 5 reviews.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
