import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// KST helper — seed runs on the server, so explicit offset keeps dates stable.
const kst = (iso: string) => new Date(`${iso}+09:00`);

async function main() {
  // Wipe (idempotent reseed) in FK-safe order.
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

  const members = await Promise.all(
    [
      { name: "의부찌", nickname: "의부찌" },
      { name: "ripple", nickname: "ripple" },
      { name: "Rachel", nickname: "Rachel" },
      { name: "eea", nickname: "eea" },
      { name: "beenie", nickname: "beenie" },
      { name: "FED", nickname: "FED" },
      { name: "BMO", nickname: "BMO" },
      { name: "아이셔", nickname: "아이셔" },
      { name: "용용", nickname: "용용" },
    ].map((u) => prisma.user.create({ data: u })),
  );
  const byNick = Object.fromEntries(members.map((m) => [m.nickname, m]));

  // ── COMPLETED meeting: June 2026 (for Archive + Instagram image demo) ──
  const june = await prisma.meeting.create({
    data: {
      year: 2026,
      month: 6,
      status: "COMPLETE",
      hostId: byNick.Rachel.id,
      confirmedDate: kst("2026-06-21T15:00:00"),
      book: {
        create: {
          title: "불안의 서",
          author: "페르난두 페소아",
        },
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
          { order: 1, content: "가장 인상 깊었던 문장은 무엇이었나요?" },
          { order: 2, content: "저자의 불안을 어떻게 이해하셨나요?" },
          { order: 3, content: "이 책에서 가장 이야기해보고 싶은 부분은?" },
        ],
      },
    },
  });

  const juneReviews: Array<{
    nick: string;
    rating: number;
    comment: string;
    attended: boolean;
  }> = [
    { nick: "ripple", rating: 4, comment: "숨겨두었던 나의 못난 마음들을 나열해둔 책", attended: true },
    {
      nick: "Rachel",
      rating: 3,
      comment: "평범한 '안녕'이라는 말이 이렇게 깊은 의미를 담고 있다는 걸 다시 생각하게 만든 책",
      attended: true,
    },
    {
      nick: "eea",
      rating: 4,
      comment: "내면의 추악함이나 모순적인 모습이 공감 가면서도 화가 나고 부끄럽게도 만든 책",
      attended: true,
    },
    { nick: "beenie", rating: 5, comment: "밑줄이 남아나질 않았다", attended: true },
    {
      nick: "FED",
      rating: 4,
      comment: "쉽게 읽히진 않지만 곱씹을수록 좋은 문장이 많았어요",
      attended: false,
    },
    { nick: "BMO", rating: 3, comment: "조금 어려웠지만 대화 나누며 이해가 깊어졌다", attended: true },
  ];

  for (const r of juneReviews) {
    await prisma.review.create({
      data: {
        meetingId: june.id,
        userId: byNick[r.nick].id,
        rating: r.rating,
        comment: r.comment,
        readBook: true,
        attended: r.attended,
        snsConsent: true,
      },
    });
  }

  // June attendance roster (5 attended, per their reviews).
  const juneAttendance: Record<string, string[]> = {
    ATTENDING: ["ripple", "Rachel", "eea", "beenie", "BMO"],
    NOT_ATTENDING: ["FED", "아이셔", "용용"],
  };
  for (const [status, nicks] of Object.entries(juneAttendance)) {
    for (const nick of nicks) {
      await prisma.attendance.create({
        data: { meetingId: june.id, userId: byNick[nick].id, status },
      });
    }
  }

  // ── CURRENT meeting: July 2026 — ~1 week before, attendance re-check ──
  // Confirmed for 7/27 (today is 2026-07-20 → D-7) so the "모임 1주일 전
  // 참석 여부 재확인" step is visible, and the flow can be driven to the end.
  const july = await prisma.meeting.create({
    data: {
      year: 2026,
      month: 7,
      status: "ATTENDANCE_CHECK",
      hostId: byNick.ripple.id,
      confirmedDate: kst("2026-07-27T15:00:00"),
      book: { create: { title: "작별인사", author: "김영하" } },
      discussionQuestions: {
        create: [
          { order: 1, content: "가장 인상 깊었던 장면은 무엇인가요?" },
          { order: 2, content: "주인공의 선택에 동의하시나요?" },
          { order: 3, content: "이 책이 전하려는 메시지는 무엇이라고 생각하나요?" },
        ],
      },
    },
  });

  const candidateDefs = ["2026-07-25", "2026-07-26", "2026-07-27"];
  const candidates = await Promise.all(
    candidateDefs.map((d) =>
      prisma.dateCandidate.create({
        data: { meetingId: july.id, date: kst(`${d}T15:00:00`) },
      }),
    ),
  );
  const availability: Record<number, string[]> = {
    0: ["ripple", "eea", "FED", "BMO"],
    1: ["ripple", "Rachel", "beenie", "아이셔"],
    2: ["ripple", "Rachel", "eea", "beenie", "FED", "BMO", "용용"],
  };
  for (let i = 0; i < candidates.length; i++) {
    for (const nick of availability[i]) {
      await prisma.dateVote.create({
        data: { candidateId: candidates[i].id, userId: byNick[nick].id },
      });
    }
  }

  const attendancePlan: Array<[string, string]> = [
    ["ripple", "ATTENDING"],
    ["Rachel", "ATTENDING"],
    ["eea", "ATTENDING"],
    ["beenie", "ATTENDING"],
    ["FED", "ATTENDING"],
    ["BMO", "ATTENDING"],
    ["아이셔", "NOT_ATTENDING"],
    ["용용", "NO_RESPONSE"],
    ["의부찌", "ATTENDING"],
  ];
  for (const [nick, status] of attendancePlan) {
    await prisma.attendance.create({
      data: { meetingId: july.id, userId: byNick[nick].id, status },
    });
  }

  console.log(
    `Seeded ${members.length} members, 2026-06 (COMPLETE) & 2026-07 (D-7 attendance re-check).`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
